"use client";

import { useAppState } from "@/lib/store";
import type { Bill } from "@/lib/types";
import { Anchor, Bob, Bx, Cyl, House, Lamp, Lawn, Mover, PAL, Pine, Road, Slab, Tree, Van } from "../kit";
import { Antenna, Apartment, Clinic, CoinBurst, PowerPlant, Studio } from "../kit2";

export function billPlot(i: number): [number, number] {
  const row = Math.floor(i / 6);
  return [-6.5 + (i % 6) * 2.6, -1.4 - row * 3.2];
}

/**
 * Bill street: each bill is the building it pays for — the power plant, your studio, the
 * internet mast, the clinic. Flags show due / paid; paying a bill fires a coin burst at it.
 */
export function ScheduleWorld() {
  const { bills } = useAppState();
  const rows = Math.ceil(bills.length / 6);
  return (
    <group>
      <Slab w={18} d={10 + (rows - 1) * 3.2} />
      <Lawn x={0} z={4.1} w={17.4} d={1.4} />
      <Road x={0} z={1.6} len={17.4} />
      {bills.map((b, i) => (
        <BillBuilding key={b.id} bill={b} index={i} />
      ))}

      <Mover path={STREET} speed={1.3} offset={0.2} startAfter={1.6}>
        <Van stripe={PAL.coral} />
        <Anchor id="payvan" p={[0, 0.7, 0]} ring={0.75} />
      </Mover>
      <Mover path={STREET} speed={1.6} offset={0.7} startAfter={1.6}>
        <Van stripe={PAL.green} />
      </Mover>

      {[-6, -2, 2, 6].map((x) => (
        <Lamp key={x} x={x} z={2.45} />
      ))}
      {[
        [-7.8, 4.2],
        [-4.2, 4.3],
        [0, 4.3],
        [4.1, 4.25],
        [7.8, 4.2],
      ].map(([x, z], i) => (i % 2 ? <Pine key={x} x={x} z={z} /> : <Tree key={x} x={x} z={z} />))}
    </group>
  );
}

const STREET: [number, number][] = [
  [-8.6, 1.85],
  [8.6, 1.85],
  [8.6, 1.35],
  [-8.6, 1.35],
];

function BillBuilding({ bill: b, index }: { bill: Bill; index: number }) {
  const [x, z] = billPlot(index);
  const id = `bill-${b.id}`;
  let body;
  switch (b.category) {
    case "Utilities":
      body = <PowerPlant x={x} z={z} id={id} />;
      break;
    case "Rent":
      body = <Apartment x={x} z={z} id={id} floors={4} />;
      break;
    case "Internet":
      body = <Antenna x={x} z={z} id={id} />;
      break;
    case "Insurance":
      body = <Clinic x={x} z={z} id={id} />;
      break;
    default:
      body = index % 2 ? <Studio x={x} z={z} id={id} roof="#9B6BF2" walls="#F3EEFB" /> : <House x={x} z={z} id={id} roof={PAL.mint} fence={false} />;
  }
  return (
    <group>
      {body}
      <Bob amp={0.08} speed={2.2} phase={index} p={[x + 0.85, 0, z + 0.6]}>
        <Cyl r={0.025} h={1.1} p={[0, 0.55, 0]} c="#A3A8B8" low />
        <Bx s={[0.42, 0.26, 0.02]} p={[0.22, 0.95, 0]} c={b.paid ? "#22B07D" : PAL.coral} o={{ emissive: b.paid ? "#22B07D" : PAL.coral, glow: 0.25 }} />
      </Bob>
      <Anchor id={id} p={[x, 2.4, z]} ring={1.3} />
      <CoinBurst burst={b.paid ? 1 : 0} p={[x, 1.2, z]} />
    </group>
  );
}
