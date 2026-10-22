"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAppState } from "@/lib/store";
import { Anchor, Bb, Bx, d, G, Lawn, mat, PAL, Pick, Pine, Rise, Slab, Tree } from "../kit";
import type { SceneProps } from "./index";

/**
 * Cash flow as a skyline: every month is a pair of towers — coral for income, charcoal for
 * expenses — with a glowing marker riding the net-profit line above them.
 */
export function ReportsWorld({ period = "ytd" }: SceneProps) {
  const { pnl } = useAppState();
  const series = useMemo(() => {
    const data = pnl.map((m) => ({ month: m.month, income: m.loss + m.profit, expenses: m.loss }));
    return period === "6m" ? data.slice(-6) : data;
  }, [pnl, period]);
  const max = Math.max(...series.map((s) => s.income), 1);
  const n = series.length;
  const pitch = 1.9;
  const x0 = -((n - 1) * pitch) / 2;
  const scale = 5.2 / max;

  return (
    <group>
      <Slab w={Math.max(14, n * pitch + 3.4)} d={9} />
      <Lawn x={0} z={3.8} w={Math.max(13.4, n * pitch + 2.8)} d={1.2} />
      <Bx s={[n * pitch + 0.6, 0.02, 0.06]} p={[0, 0.03, 1.55]} c="#D5D2DC" cast={false} rec />
      {series.map((s, i) => {
        const x = x0 + i * pitch;
        const id = `month-${s.month}`;
        return (
          <group key={s.month}>
            <Pick id={id}>
              <Rise delay={d(x, 0, 0.25) + i * 0.05} p={[x, 0, 0]}>
                <Bb s={[1.5, 0.06, 1.7]} c="#E4E1EA" />
                <Bar x={-0.33} h={s.income * scale} color={PAL.coral} striped />
                <Bar x={0.33} h={s.expenses * scale} color="#2A2730" />
              </Rise>
            </Pick>
            <Anchor id={id} p={[x, s.income * scale + 0.5, 0]} ring={1.25} />
            <Anchor id={`label-${s.month}`} p={[x, 0.05, 1.45]} ring={0.6} />
          </group>
        );
      })}
      <NetLine points={series.map((s, i) => [x0 + i * pitch, (s.income - s.expenses) * scale + 0.6] as [number, number])} />
      <Anchor id="income" p={[x0 + series.findIndex((s) => s.income === max) * pitch - 0.33, max * scale + 0.3, 0]} ring={0.9} />
      <Anchor id="expenses" p={[x0 + maxIdx(series.map((s) => s.expenses)) * pitch + 0.33, Math.max(...series.map((s) => s.expenses)) * scale + 0.3, 0]} ring={0.9} />
      <Anchor id="net" p={[x0 + (n - 1) * pitch, (series[n - 1].income - series[n - 1].expenses) * scale + 0.75, -0.9]} ring={0.8} />
      {[
        [-7.2, 3.9],
        [7.2, 3.8],
        [-7.1, -3.8],
        [7.3, -3.7],
      ].map(([x, z]) => (
        <Tree key={`${x}${z}`} x={x} z={z} />
      ))}
      <Pine x={0} z={3.9} />
    </group>
  );
}

function maxIdx(values: number[]) {
  return values.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0);
}

function Bar({ x, h, color, striped }: { x: number; h: number; color: string; striped?: boolean }) {
  const floors = Math.floor(h / 0.45);
  return (
    <group position={[x, 0.06, 0]}>
      <Bb s={[0.55, Math.max(0.05, h), 1.1]} c={color} />
      {striped &&
        Array.from({ length: floors }, (_, k) => (
          <Bx key={k} s={[0.57, 0.05, 1.12]} p={[0, 0.3 + k * 0.45, 0]} c="#F7A07F" cast={false} />
        ))}
      <Bx s={[0.6, 0.06, 1.15]} p={[0, h + 0.03, 0]} c={PAL.white} />
    </group>
  );
}

/** Net profit as a ribbon of beads floating over the skyline, with a marker running along it. */
function NetLine({ points }: { points: [number, number][] }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, -0.9))), [points]);
  const beads = useMemo(() => Array.from({ length: 40 }, (_, i) => curve.getPointAt(i / 39)), [curve]);
  const runner = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (runner.current) curve.getPointAt((clock.elapsedTime * 0.08) % 1, runner.current.position);
  });
  return (
    <Rise mode="pop" delay={1.2}>
      {beads.map((p, i) => (
        <mesh key={i} geometry={G.sph} material={mat("#22B07D", { emissive: "#22B07D", glow: 0.4 })} scale={0.09} position={p} />
      ))}
      <mesh ref={runner} geometry={G.sph} material={mat("#22B07D", { emissive: "#3CE0A0", glow: 1.2 })} scale={0.24} />
    </Rise>
  );
}
