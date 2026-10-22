"use client";

import { Anchor, Car, Conveyor, Depot, Forklift, House, Lamp, Lawn, Mover, PAL, Pallets, Person, Pick, Pine, Road, Slab, Tower, Tree, Van, Warehouse, Bx } from "../kit";

/** Loop the delivery vans drive: the road ring around the yard. */
const LOOP: [number, number][] = [
  [-8.3, 2.9],
  [-2, 2.9],
  [5.3, 2.9],
  [5.3, -1.4],
  [5.3, -5.6],
  [-1.5, -5.6],
  [-8.3, -5.6],
  [-8.3, -1.4],
];

/**
 * The business as a living city block — warehouse, HQ tower, returns depot, customer homes,
 * a picking line and delivery vans circling the yard (the reel's “online clothing store”).
 */
export function OverviewWorld() {
  return (
    <group>
      <Slab w={18} d={13} />
      <Lawn x={0} z={5.35} w={17.4} d={2.2} />
      <Lawn x={7.25} z={-1.4} w={3.3} d={6.4} />
      <Road x={-1.5} z={2.9} len={15} />
      <Road x={-1.5} z={-5.6} len={15} />
      <Road x={5.3} z={-1.35} len={9.8} axis="z" />
      <Road x={-8.3} z={-1.35} len={9.8} axis="z" />

      <Warehouse x={-2.2} z={-2} id="warehouse" />
      <Anchor id="warehouse" p={[-2.2, 2.5, -2]} ring={3} />
      <Tower x={3} z={-3.1} floors={9} id="tower" />
      <Anchor id="tower" p={[3, 4.95, -3.1]} ring={1.6} />
      <Depot x={2.65} z={0.45} id="depot" />
      <Anchor id="depot" p={[2.65, 1.3, 0.45]} ring={1.5} />

      <Pick id="pallets">
        <Pallets x={-5.55} z={0.15} />
        <Pallets x={-4.55} z={0.55} layers={1} />
      </Pick>
      <Anchor id="pallets" p={[-5.2, 0.8, 0.3]} ring={1.2} />
      <Pick id="conveyor">
        <Conveyor x={-1.4} z={0.65} len={3.2} />
      </Pick>
      <Anchor id="conveyor" p={[-1.4, 0.55, 0.65]} ring={1.8} />
      <Forklift x={-3.5} z={0.95} range={0.8} />
      <Person x={-0.4} z={1.45} c="#4C66EA" />
      <Person x={-2.6} z={1.55} c="#3CC69A" phase={2} wander={0.4} />
      <Person x={0.9} z={1.2} c={PAL.coral} phase={4} wander={0.3} />

      {[
        [-7.2, PAL.orange],
        [-5.15, PAL.roofBlue],
        [-3.1, PAL.mint],
        [-1.05, PAL.purple],
      ].map(([x, roof]) => (
        <House key={x as number} x={x as number} z={4.6} roof={roof as string} id="houses" />
      ))}
      <Anchor id="houses" p={[-4.1, 0.9, 4.6]} ring={3.3} />

      {/* parking */}
      {[-3, -1.85, -0.7].map((pz, i) => (
        <group key={pz} position={[7.35, 0.02, pz]} rotation={[0, -Math.PI / 2, 0]}>
          <Van stripe={[PAL.orange, PAL.mint, PAL.roofBlue][i]} />
        </group>
      ))}
      <Anchor id="parking" p={[7.35, 0.6, -1.85]} ring={1.6} />
      {[-3.6, -2.45, -1.3, -0.15].map((pz) => (
        <Bx key={pz} s={[0.9, 0.012, 0.04]} p={[7.35, 0.045, pz]} c="#FFFFFF" cast={false} />
      ))}

      {/* traffic */}
      <Mover path={LOOP} speed={1.25} offset={0.02}>
        <Pick id="van">
          <Van stripe={PAL.purple} />
          <Anchor id="van" p={[0, 0.65, 0]} ring={0.75} />
        </Pick>
      </Mover>
      <Mover path={LOOP} speed={1.25} offset={0.52}>
        <Van stripe={PAL.coral} />
      </Mover>
      <Mover path={LOOP} speed={1.7} offset={0.3}>
        <Car c={PAL.yellow} />
      </Mover>
      <Mover path={LOOP} speed={1.55} offset={0.78}>
        <Car c="#2F5BEA" />
      </Mover>

      {/* greenery + lamps */}
      {[
        [0.9, 5.65, "t"],
        [2.6, 5.4, "p"],
        [4.3, 5.75, "t"],
        [6.3, 5.4, "t"],
        [8.2, 4.8, "p"],
        [8.35, 2.1, "t"],
        [8.35, -4.6, "t"],
        [-6.2, -3.9, "t"],
        [-5.9, -2.3, "p"],
        [4.4, -0.6, "t"],
        [-8.4, 5.4, "t"],
        [0.4, -6.1, "p"],
        [-4.5, -6.15, "t"],
      ].map(([x, z, k]) =>
        k === "p" ? <Pine key={`${x}${z}`} x={x as number} z={z as number} /> : <Tree key={`${x}${z}`} x={x as number} z={z as number} />,
      )}
      <Lamp x={-6} z={2.05} />
      <Lamp x={-2} z={2.05} />
      <Lamp x={2} z={2.05} />
      <Lamp x={4.5} z={-3.6} ry={Math.PI} />
    </group>
  );
}
