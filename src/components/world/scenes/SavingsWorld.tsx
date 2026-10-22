"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useAppState } from "@/lib/store";
import type { Goal, GoalTone } from "@/lib/types";
import { Anchor, Bb, Bx, Coin, Crane, d, G, Lawn, mat, Mover, PAL, Pick, Pine, Rise, Road, Scaffold, Slab, Tree, Trip, Van, Vault } from "../kit";
import { CoinBurst } from "../kit2";
import { useWorld } from "../runtime";

const TONE_COLOR: Record<GoalTone, string> = {
  coral: "#F2895A",
  blue: "#4C66EA",
  green: "#3CC69A",
  purple: "#9B6BF2",
  pink: "#EE7BAA",
  amber: "#F2C230",
};

const VAULT: [number, number, number] = [0, 1.7, 3.6];

export function goalPlot(i: number, n: number): [number, number] {
  const perRow = Math.min(5, Math.max(1, n));
  const row = Math.floor(i / 5);
  const col = i % 5;
  const span = 3.2;
  return [(col - (perRow - 1) / 2) * span, -1.2 - row * 3];
}

/** Total height a goal's building will reach when complete (bigger targets → taller towers). */
export function goalHeight(g: Goal) {
  return 1.4 + Math.log10(Math.max(100, g.target)) * 0.85;
}

/**
 * Goals as buildings under construction: each tower is built up to its % saved, scaffolding
 * marks what's left, cranes work on the unfinished ones. Auto-save rules animate the money
 * pipeline from the vault — and adding money visibly raises the building.
 */
export function SavingsWorld() {
  const { goals, autoSave } = useAppState();
  const n = goals.length;
  return (
    <group>
      <Slab w={18} d={12 + Math.max(0, Math.ceil(n / 5) - 1) * 3} />
      <Lawn x={0} z={5.2} w={17.4} d={1.5} />
      <Road x={0} z={1.75} len={17.4} />

      <Vault x={VAULT[0]} z={VAULT[2]} id="vault" h={1.4} r={1.05} band={PAL.green} />
      <Anchor id="vault" p={[VAULT[0], 1.9, VAULT[2]]} ring={1.7} />

      {goals.map((g, i) => (
        <GoalTower key={g.id} goal={g} index={i} count={n} roundUps={autoSave.roundUps} />
      ))}

      {autoSave.paydayBoost && (
        <Mover path={TRUCK_PATH} speed={1.5} offset={0.15} startAfter={1.4}>
          <Pick id="truck">
            <Van stripe={PAL.green} />
            <Anchor id="truck" p={[0, 0.7, 0]} ring={0.75} />
          </Pick>
        </Mover>
      )}
      {autoSave.weekly50 && (
        <Mover path={TRUCK_PATH} speed={1.1} offset={0.6} startAfter={1.4}>
          <Van stripe={PAL.purple} />
        </Mover>
      )}
      {!autoSave.paydayBoost && <Anchor id="truck" p={[-7.5, 0.6, 1.75]} ring={0.8} />}

      {[
        [-8.3, 5.4],
        [8.3, 5.3],
        [-4.8, 5.5],
        [4.6, 5.6],
        [-8.3, -4.6],
        [8.4, -4.6],
      ].map(([x, z]) => (
        <Tree key={`${x}${z}`} x={x} z={z} />
      ))}
      <Pine x={-2.2} z={5.5} />
      <Pine x={2.4} z={5.4} />
    </group>
  );
}

const TRUCK_PATH: [number, number][] = [
  [-8.6, 1.75],
  [8.6, 1.75],
  [8.6, 1.55],
  [-8.6, 1.55],
];

function GoalTower({ goal: g, index, count, roundUps }: { goal: Goal; index: number; count: number; roundUps: boolean }) {
  const [x, z] = goalPlot(index, count);
  const full = goalHeight(g);
  const p = Math.max(0, Math.min(1, g.saved / g.target));
  const built = Math.max(0.12, full * p);
  const color = TONE_COLOR[g.tone];
  const solid = useRef<THREE.Mesh>(null);
  const top = useRef<THREE.Group>(null);
  const world = useWorld();
  const id = `g-${g.id}`;

  // Height eases toward its target so "Add money" visibly raises the tower.
  useFrame((_, dt) => {
    if (!solid.current || !top.current) return;
    const h = world.reduced ? built : THREE.MathUtils.damp(solid.current.scale.y, built, 2.5, dt);
    solid.current.scale.y = h;
    solid.current.position.y = h / 2;
    top.current.position.y = h;
  });

  return (
    <group>
      <Rise delay={d(x, z, 0.3)} p={[x, 0, z]}>
        <Bb s={[2.3, 0.08, 2.3]} c="#E4E1EA" />
        <Pick id={id}>
          <mesh ref={solid} geometry={G.box} material={mat(color)} scale={[1.5, 0.12, 1.5]} position={[0, 0.06, 0]} castShadow receiveShadow />
          <group ref={top} position={[0, 0.12, 0]}>
            <Bx s={[1.56, 0.08, 1.56]} p={[0, 0.04, 0]} c={PAL.white} />
            <Anchor id={id} p={[0, 0.45, 0]} ring={1.4} />
            <CoinBurst burst={Math.round(g.saved)} p={[0, 0.2, 0]} />
          </group>
          {p < 1 && <Scaffold w={1.52} h={full - built} d={1.52} y={built} />}
        </Pick>
      </Rise>
      {p < 0.7 && <Crane x={x + 1.25} z={z - 0.9} h={full + 0.6} />}
      {roundUps && (
        <Trip from={VAULT} to={[x, full + 0.6, z]} height={1.2} duration={2.1} delay={1.6 + index * 0.7} loop={3.6}>
          <Coin s={1.4} />
        </Trip>
      )}
    </group>
  );
}
