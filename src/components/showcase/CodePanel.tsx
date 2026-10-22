/**
 * The faux JSX editor under the dashboard in the V14 film. Purely presentational:
 * a hand-tokenised snippet with line numbers, indent guides and muted syntax colours.
 */
const C = {
  kw: "#C98BCB",
  punc: "#8B939E",
  id: "#7FC3D6",
  str: "#86C29F",
  fn: "#63C2C2",
  param: "#A9B2C5",
  type: "#7FA6D1",
  tag: "#CB76A4",
  attr: "#6FB1DE",
  num: "#E0A577",
  text: "#C9CED8",
};

type Tok = [string, keyof typeof C];

const LINES: { indent: number; toks: Tok[] }[] = [
  { indent: 0, toks: [["import", "kw"], [" { ", "punc"], ["motion", "id"], [" } ", "punc"], ["from", "kw"], [" ", "punc"], ["'framer-motion'", "str"], [";", "punc"]] },
  {
    indent: 0,
    toks: [
      ["import", "kw"],
      [" { ", "punc"],
      ["ShoppingBag", "id"],
      [", ", "punc"],
      ["Users", "id"],
      [", ", "punc"],
      ["DollarSign", "id"],
      [", ", "punc"],
      ["ArrowUpRight", "type"],
      [" } ", "punc"],
      ["from", "kw"],
      [" ", "punc"],
      ["'lucide-react'", "str"],
      [";", "punc"],
    ],
  },
  { indent: 0, toks: [] },
  {
    indent: 0,
    toks: [
      ["const", "kw"],
      [" ", "punc"],
      ["StatsCard", "fn"],
      [" = ({ ", "punc"],
      ["title", "param"],
      [", ", "punc"],
      ["value", "param"],
      [", ", "punc"],
      ["change", "param"],
      [", ", "punc"],
      ["icon", "param"],
      [": ", "punc"],
      ["Icon", "type"],
      [", ", "punc"],
      ["gradient", "param"],
      [" }) => {", "punc"],
    ],
  },
  { indent: 1, toks: [["return", "kw"], [" (", "punc"]] },
  {
    indent: 2,
    toks: [
      ["<", "punc"],
      ["motion.div", "tag"],
      [" ", "punc"],
      ["whileHover", "attr"],
      ["={{ ", "punc"],
      ["y", "param"],
      [": ", "punc"],
      ["-5", "num"],
      [" }} ", "punc"],
      ["className", "attr"],
      ["=", "punc"],
      ['"glass-card p-6 rounded-2xl"', "str"],
      [">", "punc"],
    ],
  },
  { indent: 3, toks: [["<", "punc"], ["div", "tag"], [" ", "punc"], ["className", "attr"], ["=", "punc"], ['"flex items-center justify-between"', "str"], [">", "punc"]] },
  { indent: 4, toks: [["<", "punc"], ["div", "tag"], [">", "punc"]] },
  {
    indent: 5,
    toks: [
      ["<", "punc"],
      ["p", "tag"],
      [" ", "punc"],
      ["className", "attr"],
      ["=", "punc"],
      ['"text-sm text-white/60"', "str"],
      [">", "punc"],
      ["{", "punc"],
      ["title", "id"],
      ["}", "punc"],
      ["</", "punc"],
      ["p", "tag"],
      [">", "punc"],
    ],
  },
  {
    indent: 5,
    toks: [
      ["<", "punc"],
      ["h2", "tag"],
      [" ", "punc"],
      ["className", "attr"],
      ["=", "punc"],
      ['"text-2xl font-bold text-white"', "str"],
      [">", "punc"],
      ["{", "punc"],
      ["value", "id"],
      ["}", "punc"],
      ["</", "punc"],
      ["h2", "tag"],
      [">", "punc"],
    ],
  },
  { indent: 5, toks: [["<", "punc"], ["p", "tag"], [" ", "punc"], ["className", "attr"], ["=", "punc"], ['"flex items-center gap-1 text-sm text-emerald-400"', "str"], [">", "punc"]] },
  {
    indent: 6,
    toks: [
      ["<", "punc"],
      ["ArrowUpRight", "type"],
      [" ", "punc"],
      ["size", "attr"],
      ["={", "punc"],
      ["16", "num"],
      ["} /> ", "punc"],
      ["{", "punc"],
      ["change", "id"],
      ["}", "punc"],
      ["%", "text"],
    ],
  },
  { indent: 5, toks: [["</", "punc"], ["p", "tag"], [">", "punc"]] },
  { indent: 4, toks: [["</", "punc"], ["div", "tag"], [">", "punc"]] },
];

const CHAR = 4.46; // monospace advance at 7.4px
const LINE = 10.5;

export function CodePanel() {
  return (
    <div
      aria-label="Example JSX source"
      className="absolute overflow-hidden rounded-[8px] border border-[#1C1D26] bg-[#080C12]"
      style={{ left: 54, top: 646, width: 404, height: 175 }}
    >
      {/* window chrome */}
      <span className="absolute h-[6px] w-[6px] rounded-full bg-[#FE5953]" style={{ left: 17.7, top: 7.7 }} />
      <span className="absolute h-[6px] w-[6px] rounded-full bg-[#FFCE3F]" style={{ left: 28, top: 7.7 }} />
      <span className="absolute h-[6px] w-[6px] rounded-full bg-[#22D155]" style={{ left: 38.2, top: 7.7 }} />
      <span
        className="absolute flex items-center justify-center rounded-[3px] bg-[#121821] font-mono text-[6px] text-[#99A5B2]"
        style={{ left: 379.5, top: 5.5, width: 20, height: 10.5 }}
      >
        jsx
      </span>

      <pre className="absolute m-0 font-mono text-[7.4px]" style={{ left: 0, top: 21.75, lineHeight: `${LINE}px` }}>
        {LINES.map((line, i) => (
          <div key={i} className="relative flex whitespace-pre" style={{ height: LINE }}>
            <span className="inline-block text-right text-[#3D4551]" style={{ width: 20 }}>
              {i + 1}
            </span>
            <span className="relative inline-block" style={{ marginLeft: 16.5 }}>
              {Array.from({ length: line.indent }, (_, g) => (
                <span key={g} aria-hidden className="absolute top-0 h-[10.5px] w-px bg-[#1A202B]" style={{ left: g * CHAR * 2 + 2 }} />
              ))}
              <span style={{ paddingLeft: line.indent * CHAR * 2 }}>
                {line.toks.map(([text, kind], j) => (
                  <span key={j} style={{ color: C[kind] }}>
                    {text}
                  </span>
                ))}
              </span>
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}
