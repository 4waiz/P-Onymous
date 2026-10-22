import type { Metadata } from "next";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const metadata: Metadata = { title: "Showcase frame", robots: { index: false } };

/** The live 1440×844 dashboard embedded (and scaled) by /showcase. */
export default function ShowcaseFramePage() {
  return <ShowcaseFrame />;
}
