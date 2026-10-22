import { cx } from "@/lib/cx";

/** Gradient initials badge used for contacts and quick-transfer favourites. */
export function InitialsAvatar({
  initials,
  gradient,
  size = 54,
  className,
}: {
  initials: string;
  gradient: [string, string];
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.33),
        letterSpacing: "0.01em",
        background: `linear-gradient(145deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -6px 12px rgba(0,0,0,0.06)",
      }}
    >
      {initials}
    </span>
  );
}

/** Illustrated portrait for the signed-in user (pure SVG, no photo). */
export function UserAvatar({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0 rounded-full">
      <defs>
        <linearGradient id="ua-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EDE8E4" />
          <stop offset="1" stopColor="#D9D2CC" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#ua-bg)" />
      {/* shoulders */}
      <path d="M5 40c1.2-7.4 7-11.2 15-11.2S33.8 32.6 35 40z" fill="#26211F" />
      <path d="M16.6 29.2 20 33l3.4-3.8-1.2-2.2h-4.4z" fill="#C98F6E" />
      {/* neck */}
      <rect x="17.4" y="23.5" width="5.2" height="5.4" rx="2" fill="#C2876A" />
      {/* face */}
      <ellipse cx="20" cy="17.6" rx="6.4" ry="7.4" fill="#D9A07F" />
      {/* beard */}
      <path d="M13.8 17.6c.3 5.3 2.9 8.6 6.2 8.6s5.9-3.3 6.2-8.6c-1.2 2.3-2.7 2.9-6.2 2.9s-5-.6-6.2-2.9z" fill="#2E2522" />
      <path d="M17.6 21.6c.8.5 1.6.7 2.4.7s1.6-.2 2.4-.7" stroke="#B9785B" strokeWidth=".9" strokeLinecap="round" fill="none" />
      {/* hair */}
      <path d="M13.4 15.6c-.6-5.6 2.4-9 6.8-9 4.3 0 7.2 2.9 6.5 8.6-.9-2.2-2.5-3.6-4.6-4-2.2.9-5.5 1.1-8.7 4.4z" fill="#241D1B" />
      {/* eyes */}
      <circle cx="17.5" cy="16.8" r=".75" fill="#2a201c" />
      <circle cx="22.5" cy="16.8" r=".75" fill="#2a201c" />
    </svg>
  );
}

/** The coral 71Codes mark. */
export function BrandMark({ size = 45 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <defs>
        <radialGradient id="vx-g" cx="30%" cy="25%" r="85%">
          <stop offset="0" stopColor="#F7895F" />
          <stop offset="0.55" stopColor="#EC5A33" />
          <stop offset="1" stopColor="#D9441E" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#vx-g)" />
      <text
        x="24"
        y="25.2"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="var(--font-inter), Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="20.5"
        letterSpacing="-1.2"
      >
        71
      </text>
    </svg>
  );
}
