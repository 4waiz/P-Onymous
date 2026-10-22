import { useId, type ReactNode } from "react";

/** Circular SVG flags — drawn, not images. */
export function Flag({ code, size = 18 }: { code: string; size?: number }) {
  const id = useId().replace(/:/g, "");
  const clip = `flag-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0 rounded-full">
      <defs>
        <clipPath id={clip}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{FLAGS[code] ?? <rect width="24" height="24" fill="#ccc" />}</g>
      <circle cx="12" cy="12" r="11.6" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" />
    </svg>
  );
}

const FLAGS: Record<string, ReactNode> = {
  us: (
    <>
      <rect width="24" height="24" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * 1.85} width="24" height="1.85" fill="#D3243B" />
      ))}
      <rect width="12" height="12.9" fill="#2A3C8E" />
      {[2.5, 6, 9.5].map((x) =>
        [2.5, 6.4, 10.2].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.75" fill="#fff" />),
      )}
    </>
  ),
  de: (
    <>
      <rect width="24" height="8" fill="#1A1A1A" />
      <rect y="8" width="24" height="8" fill="#DD2B2B" />
      <rect y="16" width="24" height="8" fill="#F5C518" />
    </>
  ),
  gb: (
    <>
      <rect width="24" height="24" fill="#24398A" />
      <path d="M0 0 24 24M24 0 0 24" stroke="#fff" strokeWidth="4.5" />
      <path d="M0 0 24 24M24 0 0 24" stroke="#D3243B" strokeWidth="1.6" />
      <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="6.5" />
      <path d="M12 0v24M0 12h24" stroke="#D3243B" strokeWidth="3.6" />
    </>
  ),
  ca: (
    <>
      <rect width="24" height="24" fill="#fff" />
      <rect width="6" height="24" fill="#D52B1E" />
      <rect x="18" width="6" height="24" fill="#D52B1E" />
      <path d="M12 6.5l1 2.2 1.6-.6-.5 3 1.6-1-.3 1.6 1.2.5-2.6 2 .3 1.3-2.3-.4V17h-.6v-1.9l-2.3.4.3-1.3-2.6-2 1.2-.5-.3-1.6 1.6 1-.5-3 1.6.6z" fill="#D52B1E" />
    </>
  ),
  au: (
    <>
      <rect width="24" height="24" fill="#1F3A93" />
      <path d="M0 0 12 12M12 0 0 12" stroke="#fff" strokeWidth="2.4" />
      <path d="M6 0v12M0 6h12" stroke="#fff" strokeWidth="3" />
      <path d="M6 0v12M0 6h12" stroke="#D3243B" strokeWidth="1.6" />
      <circle cx="6.5" cy="18" r="1.6" fill="#fff" />
      <circle cx="18" cy="7" r="1" fill="#fff" />
      <circle cx="20" cy="13" r="1" fill="#fff" />
      <circle cx="16" cy="17" r="1" fill="#fff" />
    </>
  ),
  jp: (
    <>
      <rect width="24" height="24" fill="#fff" />
      <circle cx="12" cy="12" r="5" fill="#C8102E" />
    </>
  ),
};
