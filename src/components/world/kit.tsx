"use client";

import { RoundedBox, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useTheme } from "@/lib/theme";
import { useWorld } from "./runtime";

/* ------------------------------------------------------------------ */
/*  Palette — soft clay pastels from the reference reel                */
/* ------------------------------------------------------------------ */

export const PAL = {
  slab: "#F3F2F6",
  slabDark: "#2A2730",
  lawn: "#DCEFE3",
  lawnDark: "#24352C",
  road: "#E7E6EC",
  roadDark: "#34313A",
  dash: "#FFFFFF",
  blue: "#2C47D9",
  green: "#3CC69A",
  greenWin: "#EFFBF6",
  purple: "#9B6BF2",
  lilac: "#CBB8F7",
  roof: "#F5F5F7",
  solar: "#1F2547",
  cream: "#F8F3EC",
  trunk: "#9C7558",
  leaf: "#8ED8A6",
  pine: "#6EC28F",
  card: "#D7AE77",
  tape: "#C1955C",
  ink: "#2B2F44",
  wheel: "#2A2A33",
  yellow: "#F2C230",
  coral: "#EA552F",
  orange: "#F2895A",
  mint: "#5CCBA2",
  roofBlue: "#4C66EA",
  skin: "#F2D0B3",
  gold: "#F4C14E",
  white: "#FBFBFD",
  steel: "#C9CBD4",
  pink: "#EE7BAA",
} as const;

export function usePalette() {
  const dark = useTheme() === "dark";
  return {
    slab: dark ? PAL.slabDark : PAL.slab,
    lawn: dark ? PAL.lawnDark : PAL.lawn,
    road: dark ? PAL.roadDark : PAL.road,
    dash: dark ? "#55505C" : PAL.dash,
    dark,
  };
}

/* ------------------------------------------------------------------ */
/*  Shared geometry + material caches                                  */
/* ------------------------------------------------------------------ */

function roofPrism() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
}

export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  sph: new THREE.SphereGeometry(0.5, 22, 16),
  cone: new THREE.ConeGeometry(0.5, 1, 16),
  roof: roofPrism(),
  cap: new THREE.CapsuleGeometry(0.5, 1, 6, 12),
  halfCyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 1, false, 0, Math.PI),
  dome: new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
  ring: new THREE.RingGeometry(0.9, 1, 64),
  disc: new THREE.CircleGeometry(1, 48),
};

const mats = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, o: { opacity?: number; emissive?: string; glow?: number; rough?: number } = {}) {
  const key = `${color}|${o.opacity ?? 1}|${o.emissive ?? ""}|${o.glow ?? 0}|${o.rough ?? 0.8}`;
  let m = mats.get(key);
  if (!m) {
    const opacity = o.opacity ?? 1;
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.8,
      metalness: 0,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
      emissive: o.emissive ?? "#000000",
      emissiveIntensity: o.glow ?? 0,
    });
    mats.set(key, m);
  }
  return m;
}

type V3 = [number, number, number];

/** Box centred on `p`. */
export function Bx({
  s,
  p = [0, 0, 0],
  r,
  c,
  cast = true,
  rec = false,
  o,
}: {
  s: V3;
  p?: V3;
  r?: V3;
  c: string;
  cast?: boolean;
  rec?: boolean;
  o?: Parameters<typeof mat>[1];
}) {
  return <mesh geometry={G.box} material={mat(c, o)} scale={s} position={p} rotation={r} castShadow={cast} receiveShadow={rec} />;
}

/** Box standing on `p` (p.y is the base). */
export function Bb({ s, p = [0, 0, 0], c, r, o, rec }: { s: V3; p?: V3; c: string; r?: V3; o?: Parameters<typeof mat>[1]; rec?: boolean }) {
  return <Bx s={s} p={[p[0], p[1] + s[1] / 2, p[2]]} c={c} r={r} o={o} rec={rec} />;
}

export function Cyl({ r, h, p = [0, 0, 0], c, rot, low, o }: { r: number; h: number; p?: V3; c: string; rot?: V3; low?: boolean; o?: Parameters<typeof mat>[1] }) {
  return <mesh geometry={low ? G.cyl8 : G.cyl} material={mat(c, o)} scale={[r * 2, h, r * 2]} position={p} rotation={rot} castShadow />;
}

export function Sph({ r, p = [0, 0, 0], c, o }: { r: number; p?: V3; c: string; o?: Parameters<typeof mat>[1] }) {
  return <mesh geometry={G.sph} material={mat(c, o)} scale={r * 2} position={p} castShadow />;
}

export function Cone({ r, h, p = [0, 0, 0], c, rot }: { r: number; h: number; p?: V3; c: string; rot?: V3 }) {
  return <mesh geometry={G.cone} material={mat(c)} scale={[r * 2, h, r * 2]} position={p} rotation={rot} castShadow />;
}

/* ------------------------------------------------------------------ */
/*  Motion helpers                                                     */
/* ------------------------------------------------------------------ */

const easeOutBack = (t: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Buildings grow out of the slab, props pop in — staggered by `delay` (seconds from world start). */
export function Rise({
  delay = 0,
  mode = "grow",
  p = [0, 0, 0],
  r,
  children,
}: {
  delay?: number;
  mode?: "grow" | "pop";
  p?: V3;
  r?: V3;
  children: ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  const done = useRef(false);
  useFrame(({ clock }) => {
    const el = g.current;
    if (!el || done.current) return;
    const t = (clock.elapsedTime - delay) / 0.7;
    const k = world.reduced ? 1 : Math.max(0, Math.min(1, t));
    const e = k >= 1 ? 1 : Math.max(0.001, easeOutBack(k));
    if (mode === "grow") el.scale.set(1, e, 1);
    else el.scale.setScalar(e);
    el.visible = k > 0;
    if (k >= 1) done.current = true;
  });
  return (
    <group ref={g} position={p} rotation={r} scale={mode === "grow" ? [1, 0.001, 1] : 0.001} visible={false}>
      {children}
    </group>
  );
}

/** Stagger helper: closer to the centre builds first. */
export function d(x: number, z: number, base = 0.25) {
  return base + Math.hypot(x, z) * 0.06;
}

/** Moves its children around a closed (or open, looping) path at a constant speed. */
export function Mover({
  path,
  speed = 1.2,
  offset = 0,
  y = 0,
  closed = true,
  startAfter = 1.2,
  children,
}: {
  path: [number, number][];
  speed?: number;
  offset?: number;
  y?: number;
  closed?: boolean;
  startAfter?: number;
  children: ReactNode;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, y, z)), closed, "catmullrom", 0.05),
    [path, closed, y],
  );
  const len = useMemo(() => curve.getLength(), [curve]);
  const g = useRef<THREE.Group>(null);
  const u = useRef(offset);
  const world = useWorld();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    const el = g.current;
    if (!el) return;
    if (!world.paused && !world.reduced && clock.elapsedTime > startAfter) u.current = (u.current + (dt * speed) / len) % 1;
    curve.getPointAt(u.current, el.position);
    curve.getTangentAt(u.current, tmp);
    el.rotation.y = Math.atan2(tmp.x, tmp.z);
  });
  return <group ref={g}>{children}</group>;
}

/** One-shot trip along an arc from `from` to `to` (parcels, drones, coins). */
export function Trip({
  from,
  to,
  height = 1.6,
  duration = 2.2,
  delay = 0,
  loop = 0,
  children,
  onArrive,
}: {
  from: V3;
  to: V3;
  height?: number;
  duration?: number;
  delay?: number;
  /** Repeat every `loop` seconds (0 = once). */
  loop?: number;
  children: ReactNode;
  onArrive?: () => void;
}) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  const t0 = useRef<number | null>(null);
  const arrived = useRef(false);
  const pausedAt = useRef(0);
  useFrame(({ clock }, dt) => {
    const el = g.current;
    if (!el) return;
    if (t0.current === null) t0.current = clock.elapsedTime + delay;
    if (world.paused) {
      pausedAt.current += dt;
      return;
    }
    let t = clock.elapsedTime - t0.current - pausedAt.current;
    if (loop > 0 && t > 0) t = t % loop;
    const k = Math.max(0, Math.min(1, t / duration));
    el.visible = t >= 0 && (loop > 0 ? t <= duration : true);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    el.position.set(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e + Math.sin(Math.PI * e) * height, from[2] + (to[2] - from[2]) * e);
    el.rotation.y = Math.atan2(to[0] - from[0], to[2] - from[2]);
    if (k >= 1 && !arrived.current && loop === 0) {
      arrived.current = true;
      onArrive?.();
    }
  });
  return (
    <group ref={g} visible={false}>
      {children}
    </group>
  );
}

export function Spin({ speed = 1, axis = "y", children, p }: { speed?: number; axis?: "x" | "y" | "z"; children: ReactNode; p?: V3 }) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  useFrame((_, dt) => {
    if (g.current && !world.paused && !world.reduced) g.current.rotation[axis] += dt * speed;
  });
  return (
    <group ref={g} position={p}>
      {children}
    </group>
  );
}

export function Bob({ amp = 0.12, speed = 2, phase = 0, children, p }: { amp?: number; speed?: number; phase?: number; children: ReactNode; p?: V3 }) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  useFrame(({ clock }) => {
    if (g.current && !world.reduced) g.current.position.y = (p?.[1] ?? 0) + Math.sin(clock.elapsedTime * speed + phase) * amp;
  });
  return (
    <group ref={g} position={p}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Anchors + picking                                                  */
/* ------------------------------------------------------------------ */

/** A point in the world that overlay cards/tags can attach to. */
export function Anchor({ id, p = [0, 0, 0], ring = 1.6 }: { id: string; p?: V3; ring?: number }) {
  const ref = useRef<THREE.Object3D>(null);
  const world = useWorld();
  useEffect(() => {
    world.anchors.set(id, {
      get: (v) => {
        if (!ref.current) return false;
        ref.current.getWorldPosition(v);
        return true;
      },
    });
    ringSizes.set(id, ring);
    return () => {
      world.anchors.delete(id);
    };
  }, [id, ring, world]);
  return <object3D ref={ref} position={p} />;
}
export const ringSizes = new Map<string, number>();

/** Hover lifts the object (and lights up its card); click opens its focus card. */
export function Pick({ id, children, lift = 0.14 }: { id: string; children: ReactNode; lift?: number }) {
  const world = useWorld();
  const [over, setOver] = useState(false);
  useCursor(over);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const el = g.current;
    if (!el) return;
    const target = world.hovered === id || world.selected === id ? lift : 0;
    el.position.y = THREE.MathUtils.damp(el.position.y, target, 12, dt);
  });
  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation();
        setOver(true);
        world.hover(id);
      }}
      onPointerOut={() => {
        setOver(false);
        if (world.hovered === id) world.hover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        world.select(world.selected === id ? null : id);
      }}
    >
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Ground                                                             */
/* ------------------------------------------------------------------ */

export function Slab({ w, d: depth, h = 0.5 }: { w: number; d: number; h?: number }) {
  const pal = usePalette();
  return (
    <RoundedBox args={[w, h, depth]} radius={0.3} smoothness={4} position={[0, -h / 2, 0]} receiveShadow>
      <meshStandardMaterial color={pal.slab} roughness={0.92} />
    </RoundedBox>
  );
}

export function Lawn({ x, z, w, d: depth }: { x: number; z: number; w: number; d: number }) {
  const pal = usePalette();
  return <Bx s={[w, 0.04, depth]} p={[x, 0.02, z]} c={pal.lawn} cast={false} rec />;
}

/** Straight road strip with dashed centre line. `axis` = direction of travel. */
export function Road({ x, z, len, axis = "x", w = 1.3 }: { x: number; z: number; len: number; axis?: "x" | "z"; w?: number }) {
  const pal = usePalette();
  const dashes = Math.floor(len / 0.9);
  return (
    <group position={[x, 0, z]} rotation={[0, axis === "x" ? 0 : Math.PI / 2, 0]}>
      <Bx s={[len, 0.03, w]} p={[0, 0.016, 0]} c={pal.road} cast={false} rec />
      {Array.from({ length: dashes }, (_, i) => (
        <Bx key={i} s={[0.38, 0.01, 0.06]} p={[-len / 2 + 0.45 + i * 0.9, 0.035, 0]} c={pal.dash} cast={false} rec />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Nature + street furniture                                          */
/* ------------------------------------------------------------------ */

export function Tree({ x, z, s = 1, delay }: { x: number; z: number; s?: number; delay?: number }) {
  return (
    <Rise mode="pop" delay={delay ?? d(x, z, 0.6)} p={[x, 0, z]}>
      <group scale={s}>
        <Cyl r={0.055} h={0.46} p={[0, 0.23, 0]} c={PAL.trunk} low />
        <Sph r={0.34} p={[0, 0.7, 0]} c={PAL.leaf} />
      </group>
    </Rise>
  );
}

export function Pine({ x, z, s = 1, delay }: { x: number; z: number; s?: number; delay?: number }) {
  return (
    <Rise mode="pop" delay={delay ?? d(x, z, 0.6)} p={[x, 0, z]}>
      <group scale={s}>
        <Cyl r={0.05} h={0.2} p={[0, 0.1, 0]} c={PAL.trunk} low />
        <Cone r={0.32} h={0.5} p={[0, 0.42, 0]} c={PAL.pine} />
        <Cone r={0.23} h={0.4} p={[0, 0.7, 0]} c={PAL.pine} />
      </group>
    </Rise>
  );
}

export function Lamp({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <Rise mode="pop" delay={d(x, z, 0.7)} p={[x, 0, z]} r={[0, ry, 0]}>
      <Cyl r={0.022} h={1.15} p={[0, 0.575, 0]} c="#B9BBC6" low />
      <Bx s={[0.34, 0.025, 0.025]} p={[0.15, 1.13, 0]} c="#B9BBC6" />
      <Bx s={[0.1, 0.03, 0.06]} p={[0.3, 1.11, 0]} c="#F7F3E6" o={{ emissive: "#FFF4D6", glow: 0.4 }} />
    </Rise>
  );
}

export function Person({ x, z, c = "#4C66EA", wander = 0.6, phase = 0 }: { x: number; z: number; c?: string; wander?: number; phase?: number }) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  const t = useRef(phase);
  useFrame((_, dt) => {
    if (!g.current || world.paused || world.reduced) return;
    t.current += dt * 0.6;
    g.current.position.x = Math.sin(t.current) * wander;
    g.current.rotation.y = Math.cos(t.current) > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <Rise mode="pop" delay={d(x, z, 0.9)} p={[x, 0, z]}>
      <group ref={g}>
        <mesh geometry={G.cap} material={mat(c)} scale={[0.13, 0.11, 0.13]} position={[0, 0.17, 0]} castShadow />
        <Sph r={0.065} p={[0, 0.36, 0]} c={PAL.skin} />
      </group>
    </Rise>
  );
}

/* ------------------------------------------------------------------ */
/*  Buildings                                                          */
/* ------------------------------------------------------------------ */

/** Instanced window grid on the +z and +x faces of a box building. */
export function WindowGrid({
  w,
  d: depth,
  h,
  rows,
  cols,
  y0 = 0.35,
  color = PAL.greenWin,
  size = 0.22,
}: {
  w: number;
  d: number;
  h: number;
  rows: number;
  cols: number;
  y0?: number;
  color?: string;
  size?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = rows * cols * 2;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(size, size, 0.03);
    let i = 0;
    const stepY = (h - y0 - 0.3) / Math.max(1, rows - 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const y = y0 + r * stepY;
        const fx = -w / 2 + (w / (cols + 1)) * (c + 1);
        const fz = -depth / 2 + (depth / (cols + 1)) * (c + 1);
        m.compose(new THREE.Vector3(fx, y, depth / 2 + 0.012), q.identity(), s);
        ref.current?.setMatrixAt(i++, m);
        m.compose(new THREE.Vector3(w / 2 + 0.012, y, fz), q.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), s);
        ref.current?.setMatrixAt(i++, m);
      }
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [w, depth, h, rows, cols, y0, size]);
  return <instancedMesh ref={ref} args={[G.box, mat(color), count]} />;
}

export function Warehouse({ x, z, ry = 0, color = PAL.blue, w = 5, dd = 3.2, h = 2, id }: { x: number; z: number; ry?: number; color?: string; w?: number; dd?: number; h?: number; id?: string }) {
  const body = (
    <>
      <Bb s={[w, h, dd]} c={color} />
      <Bx s={[w + 0.22, 0.18, dd + 0.22]} p={[0, h + 0.09, 0]} c={PAL.roof} />
      {[-0.55, 0.55].map((pz) =>
        [0, 1, 2, 3].map((i) => <Bx key={`${pz}-${i}`} s={[0.78, 0.05, 0.42]} p={[-w / 2 + 0.85 + i * ((w - 1.7) / 3), h + 0.21, pz]} c={PAL.solar} />),
      )}
      {[0, 1, 2].map((i) => (
        <Bx key={i} s={[0.82, 1.15, 0.05]} p={[-w / 2 + 0.75 + i * 1.08, 0.575, dd / 2 + 0.02]} c="#E9E9F0" />
      ))}
      <Bx s={[0.78, 0.42, 0.04]} p={[w / 2 - 0.85, 1.42, dd / 2 + 0.02]} c={PAL.white} />
      <Bx s={[0.2, 0.24, 0.02]} p={[w / 2 - 1.08, 1.42, dd / 2 + 0.045]} c={PAL.orange} />
      <Bx s={[0.34, 0.04, 0.02]} p={[w / 2 - 0.72, 1.48, dd / 2 + 0.045]} c={PAL.roofBlue} />
      <Bx s={[0.34, 0.04, 0.02]} p={[w / 2 - 0.72, 1.38, dd / 2 + 0.045]} c={PAL.roofBlue} />
      <Bx s={[0.3, 0.58, 0.04]} p={[w / 2 - 0.5, 0.29, dd / 2 + 0.02]} c="#1C1F33" />
      {[0, 1, 2, 3].map((i) => (
        <Bx key={`w${i}`} s={[0.04, 0.18, 0.24]} p={[w / 2 + 0.02, 1.45, -dd / 2 + 0.55 + i * 0.62]} c={PAL.white} />
      ))}
    </>
  );
  return (
    <Rise delay={d(x, z, 0.2)} p={[x, 0, z]} r={[0, ry, 0]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
    </Rise>
  );
}

export function Tower({ x, z, floors = 9, color = PAL.green, w = 1.9, id, delay }: { x: number; z: number; floors?: number; color?: string; w?: number; id?: string; delay?: number }) {
  const h = floors * 0.52;
  const body = (
    <>
      <Bb s={[w, h, w]} c={color} />
      <WindowGrid w={w} d={w} h={h} rows={floors} cols={4} />
      <Bx s={[w + 0.08, 0.12, w + 0.08]} p={[0, h * 0.52, 0]} c="#E4F6EE" />
      <Bx s={[w + 0.06, 0.14, w + 0.06]} p={[0, h + 0.07, 0]} c={PAL.roof} />
      <Bb s={[0.28, 0.2, 0.28]} p={[-0.35, h + 0.14, -0.2]} c={PAL.roof} />
      <Bb s={[0.22, 0.16, 0.22]} p={[0.35, h + 0.14, 0.25]} c={PAL.roof} />
    </>
  );
  return (
    <Rise delay={delay ?? d(x, z, 0.25)} p={[x, 0, z]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
    </Rise>
  );
}

export function Depot({ x, z, id, ry = 0, roof = PAL.purple, walls = PAL.lilac }: { x: number; z: number; id?: string; ry?: number; roof?: string; walls?: string }) {
  const body = (
    <>
      <Bb s={[2.1, 1.05, 1.6]} c={walls} />
      <Bx s={[2.26, 0.16, 1.76]} p={[0, 1.13, 0]} c={roof} />
      <Bx s={[0.8, 0.72, 0.04]} p={[0.35, 0.36, 0.81]} c="#EEE9FB" />
    </>
  );
  return (
    <Rise delay={d(x, z, 0.3)} p={[x, 0, z]} r={[0, ry, 0]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
    </Rise>
  );
}

export function House({
  x,
  z,
  roof = PAL.orange,
  ry = 0,
  walls = PAL.cream,
  id,
  delay,
  fence = true,
  parcel = true,
}: {
  x: number;
  z: number;
  roof?: string;
  ry?: number;
  walls?: string;
  id?: string;
  delay?: number;
  fence?: boolean;
  parcel?: boolean;
}) {
  const body = (
    <>
      <Bb s={[1.04, 0.72, 0.86]} c={walls} />
      <mesh geometry={G.roof} material={mat(roof)} scale={[1.2, 0.48, 1]} position={[0, 0.72, 0]} castShadow />
      <Bx s={[0.17, 0.3, 0.03]} p={[0.06, 0.15, 0.44]} c="#C99A6E" />
      <Bx s={[0.15, 0.15, 0.03]} p={[-0.28, 0.42, 0.44]} c="#3A2E4A" />
      <Bx s={[0.15, 0.15, 0.03]} p={[0.33, 0.42, 0.44]} c="#3A2E4A" />
      {parcel && <Bb s={[0.13, 0.11, 0.13]} p={[0.28, 0, 0.56]} c={PAL.card} />}
    </>
  );
  return (
    <Rise delay={delay ?? d(x, z, 0.35)} p={[x, 0, z]} r={[0, ry, 0]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
      {fence && (
        <group position={[0, 0, 0.82]}>
          <Bx s={[1.3, 0.025, 0.02]} p={[0, 0.12, 0]} c="#E7E3EC" />
          <Bx s={[1.3, 0.025, 0.02]} p={[0, 0.22, 0]} c="#E7E3EC" />
          {[-0.6, -0.3, 0, 0.3, 0.6].map((fx) => (
            <Bx key={fx} s={[0.03, 0.27, 0.03]} p={[fx, 0.135, 0]} c="#E7E3EC" />
          ))}
        </group>
      )}
      <group position={[-0.78, 0, 0.45]} scale={0.55}>
        <Cyl r={0.055} h={0.46} p={[0, 0.23, 0]} c={PAL.trunk} low />
        <Sph r={0.34} p={[0, 0.7, 0]} c={PAL.leaf} />
      </group>
    </Rise>
  );
}

/** Corner shop with a striped awning. */
export function Shop({ x, z, ry = 0, color = "#F6EFE6", stripe = PAL.yellow, id, h = 0.95 }: { x: number; z: number; ry?: number; color?: string; stripe?: string; id?: string; h?: number }) {
  const body = (
    <>
      <Bb s={[1.5, h, 1.1]} c={color} />
      <Bx s={[1.6, 0.1, 1.2]} p={[0, h + 0.05, 0]} c={PAL.roof} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Bx key={i} s={[0.25, 0.03, 0.42]} p={[-0.625 + i * 0.25, h * 0.68, 0.72]} r={[0.45, 0, 0]} c={i % 2 ? PAL.white : stripe} />
      ))}
      <Bx s={[1.1, 0.4, 0.03]} p={[0, 0.3, 0.56]} c="#A9D8F2" o={{ opacity: 0.85 }} />
    </>
  );
  return (
    <Rise delay={d(x, z, 0.3)} p={[x, 0, z]} r={[0, ry, 0]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
    </Rise>
  );
}

/** Hangar with a parked plane (travel / flights). */
export function Hangar({ x, z, ry = 0, id }: { x: number; z: number; ry?: number; id?: string }) {
  const body = (
    <>
      <mesh geometry={G.halfCyl} material={mat("#DDE3EE")} scale={[1.8, 2.2, 1.8]} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]} castShadow receiveShadow />
      <group position={[0, 0.15, 1.75]} rotation={[0, 0, 0]}>
        <mesh geometry={G.cap} material={mat(PAL.white)} scale={[0.22, 0.75, 0.22]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.18, 0]} castShadow />
        <Bx s={[1.5, 0.04, 0.3]} p={[0, 0.18, 0.05]} c={PAL.white} />
        <Bx s={[0.5, 0.03, 0.16]} p={[0, 0.22, -0.48]} c={PAL.white} />
        <Bx s={[0.03, 0.26, 0.18]} p={[0, 0.33, -0.5]} c={PAL.coral} />
      </group>
    </>
  );
  return (
    <Rise delay={d(x, z, 0.3)} p={[x, 0, z]} r={[0, ry, 0]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
    </Rise>
  );
}

/** Round bank vault / HQ. */
export function Vault({ x, z, id, h = 1.5, r = 1.1, band = PAL.coral }: { x: number; z: number; id?: string; h?: number; r?: number; band?: string }) {
  const body = (
    <>
      <Cyl r={r} h={h} p={[0, h / 2, 0]} c="#ECEAF1" />
      <Cyl r={r + 0.04} h={0.16} p={[0, h * 0.6, 0]} c={band} />
      <Cyl r={r + 0.08} h={0.12} p={[0, h + 0.06, 0]} c={PAL.roof} />
      <Cyl r={0.34} h={0.06} p={[0, 0.42, r - 0.01]} rot={[Math.PI / 2, 0, 0]} c="#B8BCC8" />
      <Cyl r={0.22} h={0.08} p={[0, 0.42, r + 0.02]} rot={[Math.PI / 2, 0, 0]} c="#D5D8E0" />
    </>
  );
  return (
    <Rise delay={d(x, z, 0.15)} p={[x, 0, z]}>
      {id ? <Pick id={id}>{body}</Pick> : body}
    </Rise>
  );
}

/* ------------------------------------------------------------------ */
/*  Vehicles + logistics props                                         */
/* ------------------------------------------------------------------ */

export function Van({ stripe = PAL.purple }: { stripe?: string }) {
  return (
    <group>
      <Bb s={[0.48, 0.4, 0.95]} p={[0, 0.09, 0]} c={PAL.white} />
      <Bx s={[0.44, 0.15, 0.03]} p={[0, 0.39, 0.475]} c={PAL.ink} />
      <Bx s={[0.5, 0.06, 0.62]} p={[0, 0.27, -0.1]} c={stripe} />
      {[
        [0.22, 0.3],
        [-0.22, 0.3],
        [0.22, -0.3],
        [-0.22, -0.3],
      ].map(([wx, wz]) => (
        <Cyl key={`${wx}${wz}`} r={0.09} h={0.06} p={[wx, 0.09, wz]} rot={[0, 0, Math.PI / 2]} c={PAL.wheel} low />
      ))}
    </group>
  );
}

export function Car({ c = PAL.yellow }: { c?: string }) {
  return (
    <group>
      <Bb s={[0.42, 0.15, 0.72]} p={[0, 0.07, 0]} c={c} />
      <Bb s={[0.36, 0.14, 0.38]} p={[0, 0.22, -0.04]} c={c} />
      <Bx s={[0.34, 0.1, 0.02]} p={[0, 0.29, 0.155]} c={PAL.ink} />
      {[
        [0.2, 0.22],
        [-0.2, 0.22],
        [0.2, -0.22],
        [-0.2, -0.22],
      ].map(([wx, wz]) => (
        <Cyl key={`${wx}${wz}`} r={0.075} h={0.05} p={[wx, 0.075, wz]} rot={[0, 0, Math.PI / 2]} c={PAL.wheel} low />
      ))}
    </group>
  );
}

export function Pallets({ x, z, cols = 2, rows = 2, layers = 2 }: { x: number; z: number; cols?: number; rows?: number; layers?: number }) {
  const s = 0.32;
  return (
    <Rise mode="pop" delay={d(x, z, 0.55)} p={[x, 0, z]}>
      <Bb s={[cols * s + 0.06, 0.06, rows * s + 0.06]} c="#C9A47A" />
      {Array.from({ length: cols * rows * layers }, (_, i) => {
        const cx = i % cols;
        const rz = Math.floor(i / cols) % rows;
        const ly = Math.floor(i / (cols * rows));
        return (
          <group key={i} position={[(cx - (cols - 1) / 2) * s, 0.06 + ly * s, (rz - (rows - 1) / 2) * s]}>
            <Bb s={[s * 0.94, s * 0.94, s * 0.94]} c={PAL.card} />
            <Bx s={[s * 0.95, 0.012, 0.05]} p={[0, s * 0.94 + 0.002, 0]} c={PAL.tape} cast={false} />
          </group>
        );
      })}
    </Rise>
  );
}

export function Conveyor({ x, z, len = 3, ry = 0, boxes = 5 }: { x: number; z: number; len?: number; ry?: number; boxes?: number }) {
  const refs = useRef<(THREE.Object3D | null)[]>([]);
  const world = useWorld();
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!world.paused && !world.reduced) t.current += dt * 0.45;
    refs.current.forEach((b, i) => {
      if (!b) return;
      const u = (t.current / len + i / boxes) % 1;
      b.position.x = -len / 2 + u * len;
    });
  });
  return (
    <Rise mode="pop" delay={d(x, z, 0.5)} p={[x, 0, z]} r={[0, ry, 0]}>
      <Bx s={[len, 0.08, 0.42]} p={[0, 0.36, 0]} c="#D3D5DE" />
      <Bx s={[len, 0.02, 0.34]} p={[0, 0.41, 0]} c="#9A9EAD" cast={false} />
      {[-len / 2 + 0.15, 0, len / 2 - 0.15].map((lx) => (
        <Bx key={lx} s={[0.06, 0.34, 0.36]} p={[lx, 0.17, 0]} c="#B7BAC6" />
      ))}
      {Array.from({ length: boxes }, (_, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} position={[0, 0.42, 0]}>
          <Bb s={[0.2, 0.16, 0.2]} c={PAL.card} />
        </group>
      ))}
    </Rise>
  );
}

export function Forklift({ x, z, range = 1.2, axis = "x" }: { x: number; z: number; range?: number; axis?: "x" | "z" }) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (!world.paused && !world.reduced) t.current += dt * 0.7;
    const v = Math.sin(t.current) * range;
    if (axis === "x") g.current.position.x = v;
    else g.current.position.z = v;
  });
  return (
    <Rise mode="pop" delay={d(x, z, 0.6)} p={[x, 0, z]}>
      <group ref={g} rotation={[0, axis === "x" ? Math.PI / 2 : 0, 0]}>
        <Bb s={[0.32, 0.22, 0.42]} p={[0, 0.06, 0]} c={PAL.yellow} />
        <Bb s={[0.28, 0.24, 0.2]} p={[0, 0.28, -0.08]} c={PAL.yellow} o={{ opacity: 0.95 }} />
        <Bx s={[0.04, 0.55, 0.04]} p={[0.1, 0.33, 0.23]} c="#4A4A55" />
        <Bx s={[0.04, 0.55, 0.04]} p={[-0.1, 0.33, 0.23]} c="#4A4A55" />
        <Bx s={[0.26, 0.02, 0.26]} p={[0, 0.1, 0.38]} c="#4A4A55" />
        <Sph r={0.06} p={[0, 0.36, -0.05]} c={PAL.skin} />
        {[
          [0.17, 0.12],
          [-0.17, 0.12],
          [0.17, -0.14],
          [-0.17, -0.14],
        ].map(([wx, wz]) => (
          <Cyl key={`${wx}${wz}`} r={0.06} h={0.05} p={[wx, 0.06, wz]} rot={[0, 0, Math.PI / 2]} c={PAL.wheel} low />
        ))}
      </group>
    </Rise>
  );
}

export function Coin({ s = 1 }: { s?: number }) {
  return (
    <Spin speed={3}>
      <group scale={s}>
        <Cyl r={0.15} h={0.045} rot={[Math.PI / 2, 0, 0]} c={PAL.gold} o={{ emissive: "#F6B73C", glow: 0.25, rough: 0.45 }} />
      </group>
    </Spin>
  );
}

export function Parcel({ c = PAL.coral }: { c?: string }) {
  return (
    <group>
      <Bb s={[0.24, 0.2, 0.24]} c={c} o={{ emissive: c, glow: 0.35 }} />
      <Bx s={[0.25, 0.015, 0.06]} p={[0, 0.205, 0]} c={PAL.white} cast={false} />
    </group>
  );
}

export function Drone({ c = PAL.coral }: { c?: string }) {
  return (
    <group>
      <Bx s={[0.26, 0.07, 0.26]} c="#2E3247" />
      {[
        [0.17, 0.17],
        [-0.17, 0.17],
        [0.17, -0.17],
        [-0.17, -0.17],
      ].map(([rx, rz]) => (
        <Spin key={`${rx}${rz}`} speed={22} p={[rx, 0.05, rz]}>
          <Bx s={[0.2, 0.008, 0.03]} c="#C8CBD6" cast={false} />
        </Spin>
      ))}
      <Bb s={[0.14, 0.12, 0.14]} p={[0, -0.2, 0]} c={c} o={{ emissive: c, glow: 0.3 }} />
    </group>
  );
}

/** Construction crane with a slowly slewing jib. */
export function Crane({ x, z, h = 3 }: { x: number; z: number; h?: number }) {
  return (
    <Rise delay={d(x, z, 0.5)} p={[x, 0, z]}>
      <Bb s={[0.14, h, 0.14]} c={PAL.yellow} />
      <Spin speed={0.35} p={[0, h, 0]}>
        <Bx s={[2, 0.09, 0.09]} p={[0.55, 0.06, 0]} c={PAL.yellow} />
        <Bx s={[0.3, 0.2, 0.2]} p={[-0.35, 0.06, 0]} c="#6B6E7C" />
        <Bx s={[0.012, 0.9, 0.012]} p={[1.35, -0.4, 0]} c="#6B6E7C" cast={false} />
        <Bx s={[0.12, 0.1, 0.12]} p={[1.35, -0.9, 0]} c={PAL.card} />
      </Spin>
    </Rise>
  );
}

/** Wireframe outline (unfinished floors / scaffolding). */
export function Scaffold({ w, h, d: depth, y = 0, c = "#BDB6CA" }: { w: number; h: number; d: number; y?: number; c?: string }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, depth)), [w, h, depth]);
  const floors = Math.max(1, Math.round(h / 0.5));
  return (
    <group position={[0, y + h / 2, 0]}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={c} transparent opacity={0.9} />
      </lineSegments>
      {Array.from({ length: floors - 1 }, (_, i) => (
        <mesh key={i} geometry={G.box} material={mat(c, { opacity: 0.35 })} scale={[w, 0.01, depth]} position={[0, -h / 2 + (i + 1) * (h / floors), 0]} />
      ))}
      <mesh geometry={G.box} material={mat("#ffffff", { opacity: 0.18 })} scale={[w, h, depth]} />
    </group>
  );
}
