"use client";

import { useState } from "react";
import { useAppState } from "@/lib/store";
import type { Contact } from "@/lib/types";
import { Anchor, Bx, Drone, House, Lawn, PAL, Pine, Road, Slab, Tower, Tree, Trip } from "../kit";
import { CoinBurst, Datacenter, Kiosk, Studio } from "../kit2";
import { useFreshTransaction } from "./ActivityWorld";

type V3 = [number, number, number];

/** Neighbourhood plots around the 71Codes HQ, filled in contact order. */
const PLOTS: [number, number][] = [
  [-5.2, 3.6],
  [-2.4, 4.4],
  [0.6, 4.6],
  [3.5, 4.3],
  [6.2, 3.4],
  [-6.4, -1.2],
  [6.4, -1.5],
  [-5.2, -4.4],
  [3.4, -4.6],
  [0.2, -4.9],
  [-2.7, -4.8],
  [6.4, -4.6],
];

const HQ_ROOF: V3 = [0, 3.5, -0.4];

export function contactPlot(i: number): [number, number] {
  return PLOTS[i % PLOTS.length];
}

/**
 * Your payment network: every contact is a home or shop around the 71Codes HQ. Drones fly the
 * transfers you make (favourites on a loop); a fresh transfer launches straight to its recipient.
 */
export function ContactsWorld() {
  const { contacts, transactions } = useAppState();
  const fresh = useFreshTransaction(transactions);
  const freshIdx = fresh ? contacts.findIndex((c) => fresh.counterparty === c.name) : -1;
  const favourites = contacts.map((c, i) => ({ c, i })).filter(({ c }) => c.favourite);

  return (
    <group>
      <Slab w={18} d={13} />
      <Lawn x={0} z={5.75} w={17.4} d={1.3} />
      <Road x={0} z={2.25} len={17.4} />
      <Road x={0} z={-2.85} len={17.4} />
      <Road x={-3.9} z={-0.3} len={5.1} axis="z" />
      <Road x={4.6} z={-0.3} len={5.1} axis="z" />

      <Tower x={0} z={-0.4} floors={6} color={PAL.coral} w={2} id="hq" />
      <Anchor id="hq" p={[0, 3.6, -0.4]} ring={1.8} />
      <Bx s={[0.9, 0.5, 0.05]} p={[0, 2.6, 0.62]} c={PAL.white} />

      {contacts.slice(0, PLOTS.length).map((c, i) => (
        <ContactBuilding key={c.id} contact={c} index={i} />
      ))}

      {favourites.map(({ c, i }, k) => {
        const [x, z] = contactPlot(i);
        return (
          <Trip key={c.id} from={HQ_ROOF} to={[x, 1.4, z]} height={1.6} duration={2.6} delay={1.8 + k * 1.9} loop={Math.max(5.5, favourites.length * 1.9)}>
            <Drone c={c.gradient[1]} />
          </Trip>
        );
      })}
      {fresh && freshIdx >= 0 && <FreshDrone key={fresh.id} plot={contactPlot(freshIdx)} color={contacts[freshIdx].gradient[1]} />}

      {[
        [-8.3, 5.6],
        [8.3, 5.5],
        [-8.2, -5.9],
        [8.3, -5.9],
        [-1.4, 5.8],
        [1.9, 5.85],
      ].map(([x, z]) => (
        <Tree key={`${x}${z}`} x={x} z={z} />
      ))}
      <Pine x={-8.2} z={0.8} />
      <Pine x={8.3} z={0.9} />
    </group>
  );
}

function ContactBuilding({ contact: c, index }: { contact: Contact; index: number }) {
  const [x, z] = contactPlot(index);
  const id = `c-${c.id}`;
  let body;
  if (c.kind === "Person") {
    body = <House x={x} z={z} roof={c.gradient[0]} id={id} />;
  } else if (index % 3 === 0) {
    body = <Studio x={x} z={z} roof={c.gradient[1]} id={id} />;
  } else if (index % 3 === 1) {
    body = <Kiosk x={x} z={z} color={c.gradient[1]} id={id} />;
  } else {
    body = <Datacenter x={x} z={z} id={id} />;
  }
  return (
    <>
      {body}
      <Anchor id={id} p={[x, 1.5, z]} ring={1.15} />
    </>
  );
}

function FreshDrone({ plot, color }: { plot: [number, number]; color: string }) {
  const [burst, setBurst] = useState(0);
  const target: V3 = [plot[0], 1.4, plot[1]];
  return (
    <>
      <Trip from={HQ_ROOF} to={target} height={2.4} duration={2.4} delay={0.15} onArrive={() => setBurst((b) => b + 1)}>
        <group scale={1.5}>
          <Drone c={color} />
        </group>
      </Trip>
      <CoinBurst burst={burst} p={target} />
    </>
  );
}
