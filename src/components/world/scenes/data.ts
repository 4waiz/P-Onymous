import type { TxIcon } from "@/lib/types";

/* Pure scene data shared by the WebGL worlds and the DOM overlays (no three.js imports). */

type V3 = [number, number, number];

/** Where each merchant / source lives on the block (door position the parcels travel to). */
export const MERCHANTS: Record<string, { label: string; door: V3 }> = {
  "m-grocery": { label: "Grocery", door: [-5.4, 1.15, 3.6] },
  "m-app": { label: "App Store", door: [-2.7, 1.3, 4.3] },
  "m-software": { label: "Software & design", door: [2.7, 1.45, 4.2] },
  "m-hotel": { label: "Hotel", door: [5.3, 3.45, 3.6] },
  "m-flight": { label: "Airline", door: [5.5, 1.05, -2.5] },
  "m-cloud": { label: "Cloud hosting", door: [2.6, 1.45, -4.6] },
  "m-rent": { label: "Office & bills", door: [-2.5, 2.35, -4.6] },
  "m-people": { label: "People", door: [-0.2, 1.3, -5.6] },
  client: { label: "Client Labs", door: [-5.4, 3.3, -3.6] },
};

export function merchantFor(icon: TxIcon): string {
  switch (icon) {
    case "app":
      return "m-app";
    case "hotel":
      return "m-hotel";
    case "flight":
      return "m-flight";
    case "grocery":
    case "food":
      return "m-grocery";
    case "software":
    case "design":
    case "ads":
      return "m-software";
    case "cloud":
      return "m-cloud";
    case "transfer":
    case "request":
    case "savings":
      return "m-people";
    case "salary":
    case "consulting":
    case "refund":
      return "client";
    default:
      return "m-rent";
  }
}

