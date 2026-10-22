"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import { G, ringSizes, usePalette } from "./kit";
import { useWorld } from "./runtime";
import { SCENES, type SceneKey, type SceneProps } from "./scenes";

/**
 * The WebGL half of a live world. Loaded lazily (three.js stays out of the main bundle) and
 * rendered inside <WorldPanel>, which owns the overlay cards this projects onto.
 */
function WorldCanvas({ scene, sceneProps }: { scene: SceneKey; sceneProps?: SceneProps }) {
  const registry = useWorld();
  const reduced = !!useReducedMotion();
  const [ready, setReady] = useState(false);
  const cfg = SCENES[scene].camera;
  const Scene = SCENES[scene].Component;

  useEffect(() => {
    registry.setReduced(reduced);
  }, [reduced, registry]);

  return (
    <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: FOV, near: 0.5, far: 400, position: [40, 36, 40] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.04;
          setReady(true);
        }}
        onPointerMissed={() => registry.select(null)}
        aria-label="Interactive 3D view of this page's data"
      >
        <Lights />
        <CameraRig bounds={cfg.bounds} azimuth={cfg.azimuth} polar={cfg.polar} />
        <Projector />
        <FocusRing />
        <Scene {...(sceneProps ?? {})} />
      </Canvas>
    </div>
  );
}

export default memo(WorldCanvas);

function Lights() {
  const { dark } = usePalette();
  return (
    <>
      <hemisphereLight args={["#ffffff", dark ? "#3a3542" : "#d6d0de", dark ? 0.9 : 1.35]} />
      <ambientLight intensity={dark ? 0.25 : 0.32} />
      <directionalLight
        position={[9, 17, 7]}
        intensity={dark ? 1.7 : 2.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 1, 60]} />
      </directionalLight>
    </>
  );
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const FOV = 24;

/**
 * Frames a scene's bounding box between the card columns: projects its corners from the chosen
 * angle, then solves for the distance and look-at point that centre it with a safe margin.
 */
function fitCamera(bounds: [number, number, number], polar: number, azimuth: number, aspect: number) {
  const [hx, hz, h] = bounds;
  const center = new THREE.Vector3(0, h * 0.3, 0);
  const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 1000);
  const D0 = 80;
  cam.position.copy(center).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(D0, polar, azimuth)));
  cam.lookAt(center);
  cam.updateMatrixWorld();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const v = new THREE.Vector3();
  for (const x of [-hx, hx])
    for (const z of [-hz, hz])
      for (const y of [0, h * 0.6]) {
        v.set(x, y, z).project(cam);
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      }
  const narrow = aspect < 1.5;
  const limX = narrow ? 0.98 : 0.8;
  const limY = 0.86;
  const radius = D0 * Math.max((maxX - minX) / 2 / limX, (maxY - minY) / 2 / limY);
  const halfH0 = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * D0;
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  const target = center
    .clone()
    .addScaledVector(right, ((minX + maxX) / 2) * halfH0 * aspect)
    .addScaledVector(up, ((minY + maxY) / 2) * halfH0)
    // nudge the diorama up a little so the bottom chips don't sit on it
    .addScaledVector(up, -0.05 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * radius);
  return { radius, target };
}

/** Fly-in on load, drag-to-orbit within limits, animated "reset view", aspect-aware framing. */
function CameraRig({ bounds, azimuth, polar }: { bounds: [number, number, number]; azimuth: number; polar: number }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const registry = useWorld();
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const { radius, target: tgt } = useMemo(() => fitCamera(bounds, polar, azimuth, aspect), [bounds, polar, azimuth, aspect]);
  const targetArr = useMemo(() => [tgt.x, tgt.y, tgt.z] as [number, number, number], [tgt]);
  const sph = useMemo(() => new THREE.Spherical(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const anim = useRef({ start: -1, from: new THREE.Spherical(1, polar - 0.38, azimuth + 0.7), dur: 1.9, active: true, first: true });
  const lastReset = useRef(0);

  useFrame(({ clock }) => {
    const c = controls.current;
    if (!c) return;
    if (registry.resetAt !== lastReset.current) {
      lastReset.current = registry.resetAt;
      anim.current = { start: clock.elapsedTime, from: new THREE.Spherical().setFromVector3(tmp.copy(camera.position).sub(tgt)), dur: 1.1, active: true, first: false };
    }
    const a = anim.current;
    if (a.start < 0) a.start = clock.elapsedTime;
    if (a.first) a.from.radius = radius * 1.45;
    const k = registry.reduced ? 1 : Math.min(1, (clock.elapsedTime - a.start) / a.dur);
    if (a.active) {
      // Always land the final pose, even if frames were skipped (hidden tab, slow device).
      if (k >= 1) a.active = false;
      const e = easeInOut(k);
      sph.set(
        THREE.MathUtils.lerp(a.from.radius, radius, e),
        THREE.MathUtils.lerp(a.from.phi, polar, e),
        THREE.MathUtils.lerp(a.from.theta, azimuth, e),
      );
      camera.position.copy(tgt).add(tmp.setFromSpherical(sph));
      camera.lookAt(tgt);
      c.update();
    } else {
      // Keep the diorama framed when the panel resizes (fullscreen, window resize).
      const off = tmp.copy(camera.position).sub(c.target);
      if (Math.abs(off.length() - radius) > 0.01) {
        off.setLength(THREE.MathUtils.lerp(off.length(), radius, 0.15));
        camera.position.copy(c.target).add(off);
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={targetArr}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      minPolarAngle={Math.max(0.45, polar - 0.5)}
      maxPolarAngle={Math.min(1.3, polar + 0.22)}
      minAzimuthAngle={azimuth - 1.05}
      maxAzimuthAngle={azimuth + 1.05}
    />
  );
}

/** Projects every anchored overlay (cards, tags, focus card) into panel space each frame. */
function Projector() {
  const registry = useWorld();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, gl }) => {
    const cr = gl.domElement.getBoundingClientRect();
    const w = cr.width;
    const h = cr.height;
    for (const ov of registry.overlays.values()) {
      const a = registry.anchors.get(ov.anchor);
      const group = ov.line?.parentNode as SVGGElement | null | undefined;
      if (!a || !a.get(v)) {
        if (ov.kind === "tag") ov.el.style.visibility = "hidden";
        else if (group) group.style.visibility = "hidden";
        continue;
      }
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      const onScreen = v.z < 1 && x > -40 && x < w + 40 && y > -40 && y < h + 40;
      if (ov.kind === "tag") {
        ov.el.style.visibility = onScreen ? "visible" : "hidden";
        ov.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        continue;
      }
      if (!group || !ov.line || !ov.dot) continue;
      if (ov.el.offsetParent === null || !onScreen) {
        group.style.visibility = "hidden";
        continue;
      }
      const r = ov.el.getBoundingClientRect();
      let sx = r.left - cr.left;
      let sy = r.top - cr.top + r.height / 2;
      if (ov.side === "left") sx = r.right - cr.left;
      if (ov.side === "top") {
        sx = r.left - cr.left + r.width / 2;
        sy = r.bottom - cr.top;
      }
      ov.line.setAttribute("x1", sx.toFixed(1));
      ov.line.setAttribute("y1", sy.toFixed(1));
      ov.line.setAttribute("x2", x.toFixed(1));
      ov.line.setAttribute("y2", y.toFixed(1));
      ov.dot.setAttribute("cx", x.toFixed(1));
      ov.dot.setAttribute("cy", y.toFixed(1));
      ov.halo?.setAttribute("cx", x.toFixed(1));
      ov.halo?.setAttribute("cy", y.toFixed(1));
      group.style.visibility = "visible";
    }
  });
  return null;
}

/** Pulsing orange ground ring under whatever is selected (the circle in the reel). */
function FocusRing() {
  const registry = useWorld();
  const ring = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const el = ring.current;
    if (!el) return;
    const id = registry.selected;
    const a = id ? registry.anchors.get(id) : undefined;
    if (!id || !a || !a.get(v)) {
      el.visible = false;
      return;
    }
    el.visible = true;
    el.position.set(v.x, 0.05, v.z);
    const s = (ringSizes.get(id) ?? 1.6) * (1 + Math.sin(clock.elapsedTime * 3.2) * 0.035);
    el.scale.set(s, s, s);
  });
  return (
    <group ref={ring} visible={false}>
      <mesh geometry={G.ring} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#F08A3C" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh geometry={G.disc} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <meshBasicMaterial color="#F7B077" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}
