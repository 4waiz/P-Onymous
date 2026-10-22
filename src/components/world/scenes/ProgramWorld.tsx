"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useAppState } from "@/lib/store";
import { Anchor, Bob, Bx, Cyl, Hangar, Lawn, PAL, Person, Pine, Slab, Tree } from "../kit";
import { Kiosk, Podium, Studio } from "../kit2";
import { useWorld } from "../runtime";

export const PERK_SPOTS: Record<string, [number, number]> = {
  coffee: [-5.6, 2.6],
  lounge: [5.6, -2.4],
  voucher: [5.4, 2.8],
  cinema: [-5.6, -2.6],
};

/**
 * The rewards park: stepped tiers with the crown on your current tier, points spiralling up as
 * coins, and the perk shops around the plaza (redeemed ones flagged green).
 */
export function ProgramWorld() {
  const { rewards } = useAppState();
  const tier = rewards.points >= 25000 ? 2 : rewards.points >= 10000 ? 1 : 0;
  return (
    <group>
      <Slab w={17} d={11} />
      <Lawn x={0} z={4.6} w={16.4} d={1.4} />
      <Cyl r={3.1} h={0.05} p={[0, 0.03, 0]} c="#E6E3EC" />

      <group scale={1.45}>
        <Podium x={0} z={-0.2} active={tier} id="podium" />
        <Person x={[-1.15, 0, 1.15][tier] + 0.25} z={0.45} c={PAL.coral} wander={0.12} />
      </group>
      <Anchor id="podium" p={[0, 3.2, -0.3]} ring={3.2} />
      <Anchor id="crown" p={[[-1.15, 0, 1.15][tier] * 1.45, ([0.7, 1.25, 1.85][tier] + 1.15) * 1.45, -0.3]} ring={1} />
      <CoinSpiral />

      <Kiosk x={PERK_SPOTS.coffee[0]} z={PERK_SPOTS.coffee[1]} color="#C98B5B" id="perk-coffee" />
      <Hangar x={PERK_SPOTS.lounge[0]} z={PERK_SPOTS.lounge[1]} ry={-Math.PI / 2} id="perk-lounge" />
      <Studio x={PERK_SPOTS.voucher[0]} z={PERK_SPOTS.voucher[1]} roof={PAL.pink} walls="#FDF1F6" id="perk-voucher" />
      <Studio x={PERK_SPOTS.cinema[0]} z={PERK_SPOTS.cinema[1]} roof="#7A4FE0" walls="#F2EDFC" id="perk-cinema" />
      {Object.entries(PERK_SPOTS).map(([k, [x, z]]) => (
        <group key={k}>
          <Anchor id={`perk-${k}`} p={[x, 1.6, z]} ring={1.4} />
          {rewards.redeemed.includes(k) && (
            <Bob amp={0.08} speed={2} p={[x + 0.95, 0, z + 0.7]}>
              <Cyl r={0.025} h={1.1} p={[0, 0.55, 0]} c="#A3A8B8" low />
              <Bx s={[0.4, 0.24, 0.02]} p={[0.21, 0.95, 0]} c="#22B07D" o={{ emissive: "#22B07D", glow: 0.3 }} />
            </Bob>
          )}
        </group>
      ))}

      {[
        [-7.6, 4.7],
        [7.6, 4.6],
        [-7.6, -4.6],
        [7.7, -4.6],
        [-2.6, 4.8],
        [2.6, 4.8],
      ].map(([x, z], i) => (i % 2 ? <Pine key={`${x}${z}`} x={x} z={z} /> : <Tree key={`${x}${z}`} x={x} z={z} />))}
    </group>
  );
}

/** Points as coins climbing a helix around the podium. */
function CoinSpiral() {
  const g = useRef<THREE.Group>(null);
  const world = useWorld();
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = world.reduced ? 0 : clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      const k = ((t * 0.12 + i / g.current!.children.length) % 1 + 1) % 1;
      const a = k * Math.PI * 4;
      c.position.set(Math.cos(a) * 2.65, 0.25 + k * 4.2, -0.3 + Math.sin(a) * 2.65);
      c.rotation.y = a * 2;
      c.scale.setScalar(Math.min(1, Math.sin(Math.PI * k) * 2.2) * 1.5 + 0.02);
    });
  });
  return (
    <group ref={g}>
      {Array.from({ length: 26 }, (_, i) => (
        <group key={i}>
          <Cyl r={0.15} h={0.045} rot={[Math.PI / 2, 0, 0]} c={PAL.gold} o={{ emissive: "#F6B73C", glow: 0.3, rough: 0.45 }} />
        </group>
      ))}
    </group>
  );
}
