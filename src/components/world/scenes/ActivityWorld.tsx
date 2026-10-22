"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { Anchor, Bob, Bx, Car, Cyl, Hangar, House, Lawn, Mover, PAL, Parcel, Pick, Pine, Road, Slab, Tower, Tree, Trip, Vault } from "../kit";
import { Apartment, Checkpoint, Datacenter, Hotel, Kiosk, Studio } from "../kit2";
import { CoinBurst } from "../kit2";
import { MERCHANTS, merchantFor } from "./data";

type V3 = [number, number, number];

const HUB: V3 = [0, 1.1, 0];
const CHECKPOINT: V3 = [3.2, 0.35, 0];

/**
 * Money in motion: every recent transaction becomes a parcel travelling between the 71Codes
 * vault and the merchant it paid (or the client that paid you). Pending payments queue at the
 * checkpoint; a brand-new transfer launches its own glowing parcel.
 */
export function ActivityWorld() {
  const { transactions } = useAppState();
  const flows = transactions.filter((t) => t.status === "Completed").slice(0, 9);
  const waiting = transactions.filter((t) => t.status !== "Completed");
  const fresh = useFreshTransaction(transactions);

  return (
    <group>
      <Slab w={18} d={13} />
      <Lawn x={0} z={5.6} w={17.4} d={1.6} />
      <Road x={0} z={0} len={17.4} />
      <Road x={0} z={0} len={12.4} axis="z" />
      <Cyl r={1.9} h={0.04} p={[0, 0.03, 0]} c="#E2E0E8" />

      <Vault x={0} z={0} id="hub" h={1.8} r={1.25} />
      <Anchor id="hub" p={[0, 2.2, 0]} ring={2.1} />

      <Tower x={-5.4} z={-3.6} floors={6} color={PAL.green} w={1.7} id="client" />
      <Apartment x={-2.5} z={-4.6} id="m-rent" />
      <Datacenter x={2.6} z={-4.6} id="m-cloud" />
      <Hangar x={5.5} z={-3.9} id="m-flight" />
      <Studio x={2.7} z={4.2} id="m-software" />
      <Hotel x={5.3} z={3.6} id="m-hotel" />
      <Kiosk x={-2.7} z={4.3} id="m-app" />
      <Pick id="m-grocery">
        <group position={[-5.4, 0, 3.6]}>
          <GroceryShop />
        </group>
      </Pick>
      <House x={-0.2} z={-5.6} roof={PAL.orange} id="m-people" fence={false} parcel={false} />

      {Object.entries(MERCHANTS).map(([id, m]) => (
        <Anchor key={id} id={id} p={[m.door[0], m.door[1] + 0.35, m.door[2]]} ring={1.4} />
      ))}

      <Checkpoint x={3.2} z={-0.75} id="checkpoint" open={waiting.length === 0} />
      <Anchor id="checkpoint" p={[3.2, 1.4, -0.75]} ring={1.2} />
      {waiting.slice(0, 6).map((t, i) => (
        <Bob key={t.id} amp={0.06} speed={3} phase={i} p={[CHECKPOINT[0] - 0.55 - (i % 3) * 0.3, 0.12 + Math.floor(i / 3) * 0.26, 0.25]}>
          <Parcel c="#F3A43B" />
        </Bob>
      ))}

      {flows.map((t, i) => (
        <Flow key={t.id} tx={t} index={i} count={flows.length} />
      ))}
      {fresh && <FreshFlow key={fresh.id} tx={fresh} />}

      <Mover path={LOOP} speed={1.4} offset={0.1}>
        <Car c={PAL.yellow} />
      </Mover>
      <Mover path={LOOP} speed={1.2} offset={0.6}>
        <Car c="#2F5BEA" />
      </Mover>

      {[
        [-8.2, 5.7],
        [8.2, 5.6],
        [-8.3, -5.8],
        [8.3, -5.9],
        [0.9, 5.8],
      ].map(([x, z]) => (
        <Tree key={`${x}${z}`} x={x} z={z} />
      ))}
      <Pine x={-8.2} z={-1.6} />
      <Pine x={8.2} z={1.7} />
    </group>
  );
}

const LOOP: [number, number][] = [
  [-8.4, 0.3],
  [8.4, 0.3],
  [8.4, -0.3],
  [-8.4, -0.3],
];

function GroceryShop() {
  return (
    <group>
      <Bx s={[1.6, 0.95, 1.2]} p={[0, 0.475, 0]} c="#FFF6E2" />
      <Bx s={[1.7, 0.1, 1.3]} p={[0, 1.0, 0]} c={PAL.roof} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Bx key={i} s={[0.27, 0.03, 0.42]} p={[-0.675 + i * 0.27, 0.66, 0.74]} r={[0.45, 0, 0]} c={i % 2 ? PAL.white : PAL.yellow} />
      ))}
      {[-0.45, 0, 0.45].map((fx, i) => (
        <Bx key={fx} s={[0.3, 0.22, 0.3]} p={[fx, 0.11, 0.85]} c={["#8ED8A6", "#F2895A", "#F2C230"][i]} />
      ))}
    </group>
  );
}

/** A parcel shuttling between the vault and a merchant on a staggered loop. */
function Flow({ tx, index, count }: { tx: Transaction; index: number; count: number }) {
  const m = MERCHANTS[merchantFor(tx.icon)];
  const incoming = tx.direction === "in";
  const from = incoming ? m.door : HUB;
  const to = incoming ? HUB : m.door;
  const period = Math.max(6, count * 1.1);
  return (
    <Trip from={from} to={to} height={1.3 + (index % 3) * 0.35} duration={2.4} delay={1.6 + index * (period / count)} loop={period}>
      <Parcel c={incoming ? "#22B07D" : PAL.coral} />
    </Trip>
  );
}

/** The newest transaction (one you just made) gets its own glowing trip + coin burst. */
function FreshFlow({ tx }: { tx: Transaction }) {
  const m = MERCHANTS[merchantFor(tx.icon)];
  const incoming = tx.direction === "in";
  const [burst, setBurst] = useState(0);
  return (
    <>
      <Trip from={incoming ? m.door : HUB} to={incoming ? HUB : m.door} height={2.4} duration={2.2} delay={0.2} onArrive={() => setBurst((b) => b + 1)}>
        <group scale={1.5}>
          <Parcel c={incoming ? "#22B07D" : PAL.coral} />
        </group>
      </Trip>
      <CoinBurst burst={burst} p={incoming ? HUB : m.door} />
    </>
  );
}

/** Returns a transaction only when it was added after the world mounted. */
export function useFreshTransaction(transactions: Transaction[]) {
  const first = useRef(transactions[0]?.id);
  const [fresh, setFresh] = useState<Transaction | null>(null);
  const latest = transactions[0];
  useEffect(() => {
    if (!latest || latest.id === first.current) return;
    first.current = latest.id;
    const id = window.setTimeout(() => setFresh(latest), 0);
    return () => window.clearTimeout(id);
  }, [latest]);
  return useMemo(() => fresh, [fresh]);
}
