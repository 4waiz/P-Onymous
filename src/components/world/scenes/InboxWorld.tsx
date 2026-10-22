"use client";

import { useAppState } from "@/lib/store";
import { Anchor, Bob, Lawn, Mover, PAL, Pine, Road, Slab, Spin, Tree, Trip, Van, House } from "../kit";
import { Envelope, Mailbox, PostOffice } from "../kit2";

const OFFICE: [number, number, number] = [0, 2.3, -1.2];

export function senderPlot(i: number): [number, number] {
  const spots: [number, number][] = [
    [-5.6, 3.4],
    [-2.6, 4.1],
    [2.6, 4.1],
    [5.6, 3.4],
    [-6, -2.6],
    [6, -2.6],
    [-3.4, -4.5],
    [3.4, -4.5],
  ];
  return spots[i % spots.length];
}

/**
 * The mail room: senders' homes around the post office. Every message is an envelope flying in;
 * unread ones hover above the office, starred ones turn gold.
 */
export function InboxWorld() {
  const { messages } = useAppState();
  const unread = messages.filter((m) => !m.read);
  return (
    <group>
      <Slab w={17} d={12} />
      <Lawn x={0} z={5.3} w={16.4} d={1.3} />
      <Road x={0} z={1.5} len={16.4} />

      <PostOffice x={0} z={-1.2} id="office" />
      <Anchor id="office" p={[0, 2.8, -1.2]} ring={2.2} />
      <Mailbox x={1.9} z={0.4} flag={unread.length > 0} />
      <Anchor id="mailbox" p={[1.9, 1.2, 0.4]} ring={0.7} />

      {messages.map((m, i) => {
        const [x, z] = senderPlot(i);
        return (
          <group key={m.id}>
            <House x={x} z={z} roof={m.gradient[0]} id={`msg-${m.id}`} fence={false} parcel={false} />
            <Anchor id={`msg-${m.id}`} p={[x, 1.5, z]} ring={1.1} />
            <Trip from={[x, 1.3, z]} to={OFFICE} height={1.4} duration={2.3} delay={1.5 + i * 1.3} loop={Math.max(6.5, messages.length * 1.3)}>
              <group rotation={[-0.3, 0, 0]}>
                <Envelope c={m.starred ? PAL.gold : PAL.white} />
              </group>
            </Trip>
          </group>
        );
      })}

      {/* unread stack above the office */}
      {unread.slice(0, 8).map((m, i) => (
        <Bob key={m.id} amp={0.12} speed={1.8} phase={i * 0.7} p={[OFFICE[0] + (i % 2 ? 0.45 : -0.45), 3.6 + i * 0.6, OFFICE[2]]}>
          <Spin speed={0.6}>
            <group scale={1.9}>
              <Envelope c={m.starred ? PAL.gold : PAL.white} flap={PAL.coral} />
            </group>
          </Spin>
        </Bob>
      ))}
      <Anchor id="unread" p={[OFFICE[0], 3.6 + Math.max(0, unread.length - 1) * 0.6 + 0.4, OFFICE[2]]} ring={1.2} />
      <Anchor id="starred" p={[0, 2.4, -1.2]} ring={1.6} />

      <Mover path={ROUTE} speed={1.3} offset={0.1} startAfter={1.4}>
        <Van stripe="#E2484F" />
      </Mover>

      {[
        [-7.9, 5.3],
        [7.9, 5.2],
        [-7.8, -5.3],
        [7.9, -5.2],
        [0, 5.4],
      ].map(([x, z]) => (
        <Tree key={`${x}${z}`} x={x} z={z} />
      ))}
      <Pine x={-0.4} z={-5.3} />
    </group>
  );
}

const ROUTE: [number, number][] = [
  [-8.1, 1.75],
  [8.1, 1.75],
  [8.1, 1.25],
  [-8.1, 1.25],
];
