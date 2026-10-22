"use client";

import { useAppState } from "@/lib/store";
import { Anchor, Bob, Bx, Lawn, PAL, Person, Pine, Road, Slab, Tower, Tree } from "../kit";
import { Dish, Dome, Mailbox, SkyOrb } from "../kit2";
import { usePalette } from "../kit";

/**
 * Your HQ: the security dome inflates when 2-factor sign-in is on, the dish spins for push
 * alerts, the mailbox flag rises for email alerts, and the sky orb follows your theme.
 */
export function AccountWorld() {
  const { profile } = useAppState();
  const { dark } = usePalette();
  return (
    <group>
      <Slab w={16} d={11} />
      <Lawn x={0} z={4.6} w={15.4} d={1.4} />
      <Road x={0} z={2.6} len={15.4} />

      <Tower x={0} z={-0.8} floors={7} color={PAL.coral} w={2.1} id="hq" />
      <Anchor id="hq" p={[0, 4.1, -0.8]} ring={1.9} />
      <Dome on={profile.twoFactor} r={2.6} p={[0, 0, -0.8]} />
      <Anchor id="security" p={[-1.9, 2.1, -0.8]} ring={2.8} />

      <Dish x={4.2} z={-1.6} active={profile.pushAlerts} id="push" />
      <Anchor id="push" p={[4.2, 1.6, -1.6]} ring={0.9} />
      <Mailbox x={3.6} z={1.6} flag={profile.emailAlerts} />
      <Anchor id="email" p={[3.6, 1.2, 1.6]} ring={0.7} />

      <Bob amp={0.05} speed={1.6} p={[-4.2, 0, -1.4]}>
        <Bx s={[1.1, 0.75, 0.08]} p={[0, 1.05, 0]} c={profile.weeklyDigest ? "#FFF7E2" : "#E7E4EC"} o={profile.weeklyDigest ? { emissive: "#FFE7A8", glow: 0.35 } : undefined} />
        <Bx s={[0.05, 0.7, 0.05]} p={[-0.35, 0.35, 0]} c="#A3A8B8" />
        <Bx s={[0.05, 0.7, 0.05]} p={[0.35, 0.35, 0]} c="#A3A8B8" />
        {[0, 1, 2].map((i) => (
          <Bx key={i} s={[0.8, 0.06, 0.02]} p={[0, 1.25 - i * 0.16, 0.05]} c={profile.weeklyDigest ? PAL.coral : "#C9C5D2"} cast={false} />
        ))}
      </Bob>
      <Anchor id="digest" p={[-4.2, 1.7, -1.4]} ring={0.9} />

      <SkyOrb dark={dark} p={[-3.2, 4.6, -2.6]} />
      <Anchor id="theme" p={[-3.2, 5.2, -2.6]} ring={0.8} />

      <Person x={1.4} z={1.1} c={PAL.coral} wander={0.4} />
      <Person x={-1.2} z={1.4} c="#4C66EA" wander={0.3} phase={2} />

      {[
        [-7, 4.6],
        [7, 4.5],
        [-6.9, -4.4],
        [6.9, -4.4],
        [-2.8, 4.7],
        [2.8, 4.7],
      ].map(([x, z], i) => (i % 2 ? <Pine key={`${x}${z}`} x={x} z={z} /> : <Tree key={`${x}${z}`} x={x} z={z} />))}
    </group>
  );
}
