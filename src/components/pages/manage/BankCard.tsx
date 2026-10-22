"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Nfc, Snowflake } from "lucide-react";
import { BrandMark } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";
import type { PaymentCard } from "@/lib/types";

const SKINS = {
  black: {
    face: "linear-gradient(155deg, #26222A 0%, #1C191F 48%, #151318 100%)",
    square: "rgba(255,255,255,0.045)",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.45)",
  },
  coral: {
    face: "linear-gradient(150deg, #F5825B 0%, #EC5A33 50%, #D9441E 100%)",
    square: "rgba(255,255,255,0.09)",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.7)",
  },
  lilac: {
    face: "linear-gradient(150deg, #A79AF5 0%, #8574EA 50%, #6A57D6 100%)",
    square: "rgba(255,255,255,0.1)",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.72)",
  },
} as const;

/** Soft blurred squares — the tone-on-tone pattern visible on the reference card. */
const SQUARES = [
  { x: 49, y: 10, s: 11 },
  { x: 39, y: 34, s: 11 },
  { x: 58, y: 28, s: 10 },
  { x: 67, y: 18, s: 9 },
  { x: 58, y: 52, s: 9 },
];

export function MastercardMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size * 1.62} height={size} viewBox="0 0 42 26" aria-hidden>
      <circle cx="13" cy="13" r="13" fill="#EB2A1E" />
      <circle cx="29" cy="13" r="13" fill="#F7A21B" />
      <path d="M21 3.1a13 13 0 0 1 0 19.8 13 13 0 0 1 0-19.8z" fill="#F46A18" />
    </svg>
  );
}

function formatNumber(card: PaymentCard, reveal: boolean) {
  return reveal ? card.number : `**** **** ${card.last4}`;
}

export function BankCard({
  card,
  flipped,
  reveal,
  onFlip,
  className,
}: {
  card: PaymentCard;
  flipped: boolean;
  reveal: boolean;
  onFlip: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const skin = SKINS[card.color];
  return (
    <div className={cx("flip-scene", className)}>
      <motion.button
        type="button"
        onClick={onFlip}
        aria-label={`${card.label} card ending ${card.last4}. ${flipped ? "Showing back" : "Showing front"}. Tap to flip.`}
        aria-pressed={flipped}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 17, mass: 1 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative block aspect-[1.585/1] w-full rounded-[20px] text-left outline-none"
      >
        {/* Front */}
        <div
          className="flip-face absolute inset-0 overflow-hidden rounded-[20px] shadow-[0_26px_40px_-22px_rgba(20,17,21,0.55),0_8px_16px_-10px_rgba(20,17,21,0.25)]"
          style={{ background: skin.face, color: skin.text }}
        >
          {SQUARES.map((q, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute rounded-[6px] blur-[1.5px]"
              style={{ left: `${q.x}%`, top: `${q.y}%`, width: `${q.s}%`, aspectRatio: "1", background: skin.square }}
            />
          ))}
          <div className="absolute left-[6.5%] top-[13%] flex items-center gap-[10px]">
            <Nfc size={17} strokeWidth={1.6} style={{ color: skin.sub }} />
            <span
              className={cx(
                "inline-flex h-[24px] items-center rounded-full px-[11px] text-[11px] font-semibold",
                card.frozen ? "bg-[#DCEBFA] text-[#2F6FB5]" : "bg-white text-[#1A171C]",
              )}
            >
              {card.frozen ? "Frozen" : "Active"}
            </span>
          </div>
          <div className="absolute right-[6.5%] top-[10%]">
            <MastercardMark size={26} />
          </div>
          <div className="absolute bottom-[12%] left-[6.5%] right-[6.5%] flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] leading-none" style={{ color: skin.sub }}>
                Card Number
              </p>
              <p className="mt-[9px] whitespace-nowrap font-mono text-[15px] font-medium leading-none tracking-[0.14em]">{formatNumber(card, reveal)}</p>
            </div>
            <div className="flex shrink-0 gap-[22px]">
              <div>
                <p className="text-[10px] leading-none" style={{ color: skin.sub }}>
                  EXP
                </p>
                <p className="mt-[9px] font-mono text-[15px] font-medium leading-none tracking-[0.08em]">{card.expiry}</p>
              </div>
              <div>
                <p className="text-[10px] leading-none" style={{ color: skin.sub }}>
                  CVV
                </p>
                <p className="mt-[9px] font-mono text-[15px] font-medium leading-none tracking-[0.08em]">{card.cvv}</p>
              </div>
            </div>
          </div>
          {card.frozen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(214,232,250,0.42),rgba(255,255,255,0.12))] backdrop-blur-[2px]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-[#2F6FB5] shadow-lg">
                <Snowflake size={22} strokeWidth={1.8} />
              </span>
            </motion.div>
          )}
        </div>

        {/* Back */}
        <div
          className="flip-face absolute inset-0 overflow-hidden rounded-[20px] shadow-[0_26px_40px_-22px_rgba(20,17,21,0.55)]"
          style={{ background: skin.face, color: skin.text, transform: "rotateY(180deg)" }}
        >
          <div className="absolute inset-x-0 top-[13%] h-[18%] bg-black/70" />
          <div className="absolute left-[6.5%] right-[6.5%] top-[42%] flex items-center gap-3">
            <div className="h-[34px] flex-1 rounded-[6px] bg-[repeating-linear-gradient(135deg,#f4f1f5_0_6px,#e6e2e8_6px_12px)]" />
            <div className="flex h-[34px] items-center rounded-[6px] bg-white px-3 font-mono text-[14px] font-semibold tracking-[0.1em] text-[#1A171C]">
              {card.cvv}
            </div>
          </div>
          <p className="absolute bottom-[12%] left-[6.5%] max-w-[62%] text-[9.5px] leading-snug" style={{ color: skin.sub }}>
            Demo virtual card issued by 71Codes. Not a real payment instrument — for interface testing only.
          </p>
          <div className="absolute bottom-[10%] right-[6.5%] flex items-center gap-2">
            <BrandMark size={26} />
            <span className="text-[13px] font-semibold">71Codes</span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
