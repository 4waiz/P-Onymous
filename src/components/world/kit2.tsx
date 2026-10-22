"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Bb, Bob, Bx, Cone, Cyl, d, G, mat, PAL, Pick, Rise, Sph, Spin, WindowGrid } from "./kit";
import { useWorld } from "./runtime";

type V3 = [number, number, number];

function Wrap({ x, z, ry = 0, id, delay, children }: { x: number; z: number; ry?: number; id?: string; delay?: number; children: ReactNode }) {
  return (
    <Rise delay={delay ?? d(x, z, 0.3)} p={[x, 0, z]} r={[0, ry, 0]}>
      {id ? <Pick id={id}>{children}</Pick> : children}
    </Rise>
  );
}

export function Hotel({ x, z, ry = 0, id }: { x: number; z: number; ry?: number; id?: string }) {
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.6, 3.2, 1.3]} c="#F1E6D6" />
      <WindowGrid w={1.6} d={1.3} h={3.2} rows={6} cols={3} color="#5B6C9C" size={0.18} />
      <Bx s={[1.7, 0.16, 1.4]} p={[0, 3.28, 0]} c="#1F2B6E" />
      <Bx s={[0.12, 0.9, 0.5]} p={[0.86, 2.3, 0.2]} c="#1F2B6E" />
      <Bx s={[0.5, 0.42, 0.04]} p={[0, 0.21, 0.66]} c="#C9A06A" />
    </Wrap>
  );
}

export function Kiosk({ x, z, ry = 0, id, color = "#2F7BF2" }: { x: number; z: number; ry?: number; id?: string; color?: string }) {
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.1, 0.9, 0.9]} c={color} />
      <Bx s={[1.2, 0.12, 1]} p={[0, 0.96, 0]} c={PAL.white} />
      <Bx s={[0.8, 0.36, 0.03]} p={[0, 0.5, 0.46]} c="#DDEBFF" o={{ emissive: "#9CC2FF", glow: 0.3 }} />
      <Bx s={[0.3, 0.3, 0.03]} p={[0, 1.25, 0]} c={PAL.white} />
    </Wrap>
  );
}

export function Studio({ x, z, ry = 0, id, roof = "#E2484F", walls = "#F7EEF0" }: { x: number; z: number; ry?: number; id?: string; roof?: string; walls?: string }) {
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.7, 1.2, 1.3]} c={walls} />
      <Bx s={[1.82, 0.16, 1.42]} p={[0, 1.28, 0]} c={roof} />
      <Bx s={[1.2, 0.5, 0.03]} p={[0, 0.62, 0.66]} c="#28243A" o={{ emissive: "#5E4BD6", glow: 0.35 }} />
      <Bx s={[0.34, 0.5, 0.03]} p={[0.55, 0.25, 0.66]} c="#C99A6E" />
    </Wrap>
  );
}

export function Datacenter({ x, z, ry = 0, id }: { x: number; z: number; ry?: number; id?: string }) {
  const leds = useRef<THREE.Group>(null);
  const world = useWorld();
  useFrame(({ clock }) => {
    if (!leds.current || world.reduced) return;
    leds.current.children.forEach((c, i) => {
      c.visible = Math.sin(clock.elapsedTime * 4 + i * 1.7) > -0.2;
    });
  });
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.8, 1.1, 1.3]} c="#E3E6EE" />
      <Bx s={[1.9, 0.12, 1.4]} p={[0, 1.16, 0]} c="#C7CCD8" />
      {[-0.45, 0, 0.45].map((fx) => (
        <Cyl key={fx} r={0.16} h={0.14} p={[fx, 1.28, -0.25]} c="#B3B8C6" low />
      ))}
      <group ref={leds}>
        {Array.from({ length: 8 }, (_, i) => (
          <Bx key={i} s={[0.06, 0.06, 0.02]} p={[-0.7 + i * 0.2, 0.75, 0.66]} c="#38D39F" o={{ emissive: "#38D39F", glow: 1.2 }} cast={false} />
        ))}
      </group>
    </Wrap>
  );
}

export function Apartment({ x, z, ry = 0, id, color = "#F2C9A8", floors = 4 }: { x: number; z: number; ry?: number; id?: string; color?: string; floors?: number }) {
  const h = floors * 0.55;
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.6, h, 1.3]} c={color} />
      <WindowGrid w={1.6} d={1.3} h={h} rows={floors} cols={3} color="#FFF8F0" size={0.2} />
      <Bx s={[1.7, 0.14, 1.4]} p={[0, h + 0.07, 0]} c={PAL.roof} />
    </Wrap>
  );
}

/** Toll-style checkpoint where pending payments wait. */
export function Checkpoint({ x, z, ry = 0, id, open }: { x: number; z: number; ry?: number; id?: string; open?: boolean }) {
  const arm = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.Mesh>(null);
  const world = useWorld();
  useFrame(({ clock }, dt) => {
    if (arm.current) arm.current.rotation.z = THREE.MathUtils.damp(arm.current.rotation.z, open ? 1.2 : 0, 4, dt);
    if (lamp.current && !world.reduced) lamp.current.visible = Math.sin(clock.elapsedTime * 5) > 0;
  });
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[0.6, 0.85, 0.6]} c={PAL.white} />
      <Bx s={[0.7, 0.1, 0.7]} p={[0, 0.9, 0]} c={PAL.yellow} />
      <mesh ref={lamp} geometry={G.sph} material={mat("#FFB020", { emissive: "#FFB020", glow: 1.4 })} scale={0.16} position={[0, 1.05, 0]} />
      <group ref={arm} position={[0.32, 0.55, 0]}>
        <Bx s={[1.5, 0.07, 0.07]} p={[0.75, 0, 0]} c="#E2484F" />
        {[0.3, 0.75, 1.2].map((ax) => (
          <Bx key={ax} s={[0.18, 0.075, 0.075]} p={[ax, 0, 0]} c={PAL.white} cast={false} />
        ))}
      </group>
    </Wrap>
  );
}

export function PostOffice({ x, z, ry = 0, id }: { x: number; z: number; ry?: number; id?: string }) {
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[2.6, 1.4, 1.8]} c="#F6F1EA" />
      <mesh geometry={G.roof} material={mat("#E2484F")} scale={[2.85, 0.7, 2]} position={[0, 1.4, 0]} castShadow />
      <Bx s={[1.2, 0.32, 0.04]} p={[0, 1.05, 0.92]} c="#2C47D9" />
      <Bx s={[0.5, 0.1, 0.02]} p={[0, 1.05, 0.95]} c={PAL.white} cast={false} />
      <Bx s={[0.6, 0.7, 0.04]} p={[0, 0.35, 0.92]} c="#C99A6E" />
      {[-0.85, 0.85].map((wx) => (
        <Bx key={wx} s={[0.38, 0.32, 0.04]} p={[wx, 0.62, 0.92]} c="#3A2E4A" />
      ))}
    </Wrap>
  );
}

export function Mailbox({ x, z, flag = true }: { x: number; z: number; flag?: boolean }) {
  const f = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (f.current) f.current.rotation.z = THREE.MathUtils.damp(f.current.rotation.z, flag ? 0 : -1.4, 6, dt);
  });
  return (
    <Rise mode="pop" delay={d(x, z, 0.6)} p={[x, 0, z]}>
      <Cyl r={0.04} h={0.6} p={[0, 0.3, 0]} c="#7A7E8E" low />
      <Bx s={[0.26, 0.24, 0.42]} p={[0, 0.72, 0]} c="#2C47D9" />
      <group ref={f} position={[0.14, 0.72, -0.1]}>
        <Bx s={[0.02, 0.24, 0.04]} p={[0, 0.12, 0]} c="#E2484F" />
        <Bx s={[0.02, 0.08, 0.12]} p={[0, 0.2, 0.06]} c="#E2484F" />
      </group>
    </Rise>
  );
}

export function Envelope({ c = PAL.white, flap = "#E9E4EF" }: { c?: string; flap?: string }) {
  return (
    <group>
      <Bx s={[0.42, 0.28, 0.04]} c={c} o={c === PAL.gold ? { emissive: "#F6B73C", glow: 0.3 } : undefined} />
      <Bx s={[0.3, 0.02, 0.045]} p={[-0.1, 0.05, 0.002]} r={[0, 0, -0.55]} c={flap} cast={false} />
      <Bx s={[0.3, 0.02, 0.045]} p={[0.1, 0.05, 0.002]} r={[0, 0, 0.55]} c={flap} cast={false} />
    </group>
  );
}

export function PowerPlant({ x, z, ry = 0, id }: { x: number; z: number; ry?: number; id?: string }) {
  const puffs = useRef<THREE.Group>(null);
  const world = useWorld();
  useFrame(({ clock }) => {
    if (!puffs.current || world.reduced) return;
    puffs.current.children.forEach((p, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 4) % 1;
      p.position.y = 2.05 + t * 1.2;
      p.scale.setScalar(0.25 + t * 0.35);
      ((p as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.75 * (1 - t);
    });
  });
  const puffMats = useMemo(() => [0, 1, 2, 3].map(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.6, depthWrite: false })), []);
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.5, 0.9, 1.2]} c="#E8E3D8" />
      <Bx s={[1.58, 0.1, 1.28]} p={[0, 0.95, 0]} c="#F2C230" />
      <mesh geometry={G.cyl} material={mat("#DCD7CF")} scale={[0.9, 1.6, 0.9]} position={[-0.95, 0.8, -0.2]} castShadow />
      <Cyl r={0.12} h={1.3} p={[0.45, 1.6, -0.25]} c="#C9C2B6" low />
      <group ref={puffs} position={[0.45, 0, -0.25]}>
        {puffMats.map((m, i) => (
          <mesh key={i} geometry={G.sph} material={m} />
        ))}
      </group>
    </Wrap>
  );
}

export function Antenna({ x, z, id }: { x: number; z: number; id?: string }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.ConeGeometry(0.5, 3, 4, 6)), []);
  return (
    <Wrap x={x} z={z} id={id}>
      <lineSegments geometry={geo} position={[0, 1.5, 0]}>
        <lineBasicMaterial color="#9AA0B4" />
      </lineSegments>
      <Bb s={[0.9, 0.08, 0.9]} c="#C9CDD8" />
      <Bob amp={0.02} speed={6} p={[0, 3.05, 0]}>
        <Sph r={0.08} c="#E2484F" o={{ emissive: "#E2484F", glow: 1.2 }} />
      </Bob>
      <Bx s={[0.3, 0.12, 0.05]} p={[0, 2.3, 0.12]} c={PAL.white} />
    </Wrap>
  );
}

export function Clinic({ x, z, ry = 0, id }: { x: number; z: number; ry?: number; id?: string }) {
  return (
    <Wrap x={x} z={z} ry={ry} id={id}>
      <Bb s={[1.7, 1.1, 1.3]} c={PAL.white} />
      <Bx s={[1.8, 0.14, 1.4]} p={[0, 1.17, 0]} c="#7FD3C0" />
      <Bx s={[0.42, 0.12, 0.04]} p={[0, 0.8, 0.66]} c="#E2484F" />
      <Bx s={[0.12, 0.42, 0.04]} p={[0, 0.8, 0.66]} c="#E2484F" />
      <Bx s={[0.5, 0.45, 0.04]} p={[0, 0.225, 0.66]} c="#A9D8F2" />
    </Wrap>
  );
}

/** Stepped tiers (rewards program) with the active tier crowned. */
export function Podium({ x, z, active = 1, id }: { x: number; z: number; active?: number; id?: string }) {
  const tiers = [
    { c: "#D9DCE4", h: 0.7, px: -1.15 },
    { c: "#F2C94C", h: 1.25, px: 0 },
    { c: "#B9C7EA", h: 1.85, px: 1.15 },
  ];
  return (
    <Wrap x={x} z={z} id={id}>
      {tiers.map((t, i) => (
        <group key={i}>
          <Bb s={[1.1, t.h, 1.1]} p={[t.px, 0, 0]} c={t.c} />
          <Bx s={[1.14, 0.06, 1.14]} p={[t.px, t.h + 0.03, 0]} c={PAL.white} />
          {i === active && (
            <Bob amp={0.08} speed={2} p={[t.px, t.h + 0.75, 0]}>
              <Crown />
            </Bob>
          )}
        </group>
      ))}
    </Wrap>
  );
}

export function Crown() {
  return (
    <Spin speed={0.8}>
      <Cyl r={0.26} h={0.16} c={PAL.gold} o={{ emissive: "#F6B73C", glow: 0.35, rough: 0.4 }} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return <Cone key={i} r={0.07} h={0.2} p={[Math.cos(a) * 0.22, 0.16, Math.sin(a) * 0.22]} c={PAL.gold} />;
      })}
      <Sph r={0.06} p={[0, 0.02, 0.27]} c="#E2484F" />
    </Spin>
  );
}

/** Translucent security dome that inflates when 2-factor sign-in is on. */
export function Dome({ on, r = 3, p = [0, 0, 0] as V3 }: { on: boolean; r?: number; p?: V3 }) {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  const wire = useMemo(() => new THREE.WireframeGeometry(new THREE.SphereGeometry(0.5, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2)), []);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const target = on ? 1 : 0.001;
    const s = THREE.MathUtils.damp(g.current.scale.x, target, 5, dt);
    g.current.scale.setScalar(s);
    g.current.visible = s > 0.01;
    if (!world.reduced) g.current.rotation.y = clock.elapsedTime * 0.08;
  });
  return (
    <group ref={g} position={p} scale={0.001}>
      <mesh geometry={G.dome} scale={r * 2} material={mat("#8FB4FF", { opacity: 0.16 })} />
      <lineSegments geometry={wire} scale={r * 2}>
        <lineBasicMaterial color="#7FA3F5" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
}

export function Dish({ x, z, active, id }: { x: number; z: number; active: boolean; id?: string }) {
  const head = useRef<THREE.Group>(null);
  const world = useWorld();
  useFrame((_, dt) => {
    if (head.current && active && !world.paused && !world.reduced) head.current.rotation.y += dt * 0.8;
  });
  return (
    <Wrap x={x} z={z} id={id}>
      <Cyl r={0.08} h={0.8} p={[0, 0.4, 0]} c="#A3A8B8" low />
      <group ref={head} position={[0, 0.85, 0]}>
        <group rotation={[-0.9, 0, 0]}>
          <mesh geometry={G.cone} material={mat(active ? PAL.white : "#C9CDD8")} scale={[0.9, 0.3, 0.9]} rotation={[Math.PI, 0, 0]} castShadow />
          <Cyl r={0.02} h={0.4} p={[0, 0.2, 0]} c="#7A7E8E" low />
          <Sph r={0.05} p={[0, 0.42, 0]} c={active ? "#38D39F" : "#9AA0B4"} o={active ? { emissive: "#38D39F", glow: 1.2 } : undefined} />
        </group>
      </group>
    </Wrap>
  );
}

/** Floating sun (light theme) or moon (dark theme). */
export function SkyOrb({ dark, p }: { dark: boolean; p: V3 }) {
  return (
    <Bob amp={0.15} speed={1.4} p={p}>
      <Spin speed={0.4}>
        {dark ? (
          <>
            <Sph r={0.45} c="#E9E6F7" o={{ emissive: "#B8B2E8", glow: 0.5 }} />
            <Sph r={0.1} p={[0.18, 0.12, 0.38]} c="#CFCBE6" />
            <Sph r={0.07} p={[-0.2, -0.1, 0.4]} c="#CFCBE6" />
          </>
        ) : (
          <>
            <Sph r={0.42} c="#FFD25E" o={{ emissive: "#FFB72E", glow: 0.7 }} />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <Bx key={i} s={[0.24, 0.06, 0.06]} p={[Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0]} r={[0, 0, a]} c="#FFC93E" o={{ emissive: "#FFB72E", glow: 0.6 }} />;
            })}
          </>
        )}
      </Spin>
    </Bob>
  );
}

/** A coin shower that plays once when `burst` changes (money added, bill paid). */
export function CoinBurst({ burst, p }: { burst: number; p: V3 }) {
  const g = useRef<THREE.Group>(null);
  const start = useRef(-1);
  const last = useRef(burst);
  useFrame(({ clock }) => {
    const el = g.current;
    if (!el) return;
    if (burst !== last.current) {
      last.current = burst;
      start.current = clock.elapsedTime;
    }
    const t = start.current < 0 ? 2 : clock.elapsedTime - start.current;
    el.visible = t < 1.4;
    el.children.forEach((c, i) => {
      const a = (i / el.children.length) * Math.PI * 2;
      const k = Math.min(1, t / 1.4);
      c.position.set(Math.cos(a) * k * 0.9, 0.3 + Math.sin(Math.PI * k) * 1.4 + k * 0.4, Math.sin(a) * k * 0.9);
      c.rotation.y = t * 8 + i;
    });
  });
  return (
    <group ref={g} position={p} visible={false}>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} geometry={G.cyl} material={mat(PAL.gold, { emissive: "#F6B73C", glow: 0.4, rough: 0.4 })} scale={[0.26, 0.04, 0.26]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
    </group>
  );
}

export { Cone, Sph };
