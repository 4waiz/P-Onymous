import type { Metadata } from "next";
import { ShowcaseStage } from "@/components/showcase/ShowcaseStage";

export const metadata: Metadata = {
  title: "Dashboard V14 — Showcase",
  description: "The 71Codes V14 dashboard film, played live: overview, contacts, savings and manage in a 9:16 stage.",
};

export default function ShowcasePage() {
  return <ShowcaseStage />;
}
