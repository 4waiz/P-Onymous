import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  Cloud,
  Megaphone,
  Monitor,
  Palette,
  PenTool,
  PiggyBank,
  ReceiptText,
  RotateCcw,
  Send,
  ShieldCheck,
  Sun,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { TxIcon } from "@/lib/types";

type Meta = { bg?: string; fg: string; Icon?: LucideIcon; glyph?: "app" | "wing" };

const META: Record<TxIcon, Meta> = {
  app: { bg: "linear-gradient(160deg,#4FB0FA,#1C6FE9)", fg: "#fff", glyph: "app" },
  hotel: { fg: "#1F2B6E", glyph: "wing" },
  flight: { fg: "#B8962E", Icon: Send },
  grocery: { fg: "#F2B705", Icon: Sun },
  software: { bg: "linear-gradient(160deg,#F2555A,#D0202B)", fg: "#fff", Icon: PenTool },
  salary: { bg: "linear-gradient(160deg,#54D394,#22A86A)", fg: "#fff", Icon: Banknote },
  rent: { bg: "var(--inset-strong)", fg: "var(--ink-2)", Icon: Building2 },
  cloud: { bg: "linear-gradient(160deg,#7CCBF5,#3D9BE0)", fg: "#fff", Icon: Cloud },
  transfer: { bg: "var(--accent-soft)", fg: "var(--accent)", Icon: ArrowUpRight },
  food: { bg: "#FFF0E3", fg: "#E57A2E", Icon: UtensilsCrossed },
  ads: { bg: "#F1E8FD", fg: "#8A4BE0", Icon: Megaphone },
  equipment: { bg: "var(--inset-strong)", fg: "var(--ink-2)", Icon: Monitor },
  insurance: { bg: "#E2F6EF", fg: "#1F9C77", Icon: ShieldCheck },
  refund: { bg: "var(--pos-bg)", fg: "var(--pos)", Icon: RotateCcw },
  design: { bg: "#FCE6F0", fg: "#D2457E", Icon: Palette },
  consulting: { bg: "#E6EEFC", fg: "#3B6FE0", Icon: BriefcaseBusiness },
  utilities: { bg: "#FDF3D9", fg: "#D49A0E", Icon: Zap },
  request: { bg: "var(--info-bg)", fg: "var(--info)", Icon: ArrowDownLeft },
  savings: { bg: "var(--accent-soft)", fg: "var(--accent)", Icon: PiggyBank },
  bill: { bg: "var(--inset-strong)", fg: "var(--ink-2)", Icon: ReceiptText },
};

/** Small merchant/category glyph used in tables and the live feed. */
export function TxGlyph({ icon, size = 18 }: { icon: TxIcon; size?: number }) {
  const m = META[icon];
  const inner = Math.round(size * (m.bg ? 0.58 : 0.86));
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: Math.max(4, size * 0.26), background: m.bg, color: m.fg }}
    >
      {m.glyph === "app" ? (
        <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M9.5 4.5 16 16M14.5 4.5 8 16M5 16h14" />
        </svg>
      ) : m.glyph === "wing" ? (
        <svg width={inner} height={inner} viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 4.5c4.2.6 7.6 3.2 10 8.2 2.4-5 5.8-7.6 10-8.2-2.3 4.6-5.5 10.3-10 15-4.5-4.7-7.7-10.4-10-15z" />
        </svg>
      ) : m.Icon ? (
        <m.Icon size={inner} strokeWidth={m.bg ? 2.2 : 2} />
      ) : null}
    </span>
  );
}
