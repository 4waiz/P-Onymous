"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";

/* ------------------------------------------------------------------ */
/*  Portal target lives inside the app frame, so overlays stay inside  */
/*  the scaled viewport on /showcase and inside the viewport normally. */
/* ------------------------------------------------------------------ */

const PortalContext = createContext<HTMLElement | null>(null);

export function PortalProvider({ target, children }: { target: HTMLElement | null; children: ReactNode }) {
  return <PortalContext.Provider value={target}>{children}</PortalContext.Provider>;
}

export function Portal({ children }: { children: ReactNode }) {
  const target = useContext(PortalContext);
  if (!target) return null;
  return createPortal(children, target);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Escape-to-close + focus trap + focus restore. */
function useDialogBehaviour(open: boolean, onClose: () => void, panel: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const el = panel.current;
      if (!el) return;
      const auto = el.querySelector<HTMLElement>("[data-autofocus]");
      (auto ?? el.querySelector<HTMLElement>(FOCUSABLE) ?? el).focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [open, panel]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 440,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: number;
  hideClose?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useDialogBehaviour(open, onClose, panel);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="modal"
            className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="absolute inset-0 bg-[rgba(26,23,28,0.28)] backdrop-blur-[2px]"
              onClick={onClose}
              aria-hidden
            />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, y: 18, scale: 0.97, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
              exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ width: `min(${width}px, 100%)` }}
              className="relative max-h-[calc(100%-32px)] overflow-y-auto rounded-[24px] bg-card p-6 text-ink shadow-pop outline-none v-scroll"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id={titleId} className="text-[19px] font-semibold tracking-[-0.01em]">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="mt-1 text-[13px] text-muted">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="-mr-1 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-well hover:text-ink"
                  >
                    <X size={18} strokeWidth={1.8} />
                  </button>
                )}
              </div>
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/**
 * Anchored dropdown panel, portalled so table/scroll containers never clip it.
 * Positioned from the anchor's rect; closes on outside click, Escape, scroll and resize.
 */
export function Popover({
  open,
  onClose,
  anchor,
  children,
  align = "right",
  width = 320,
  label,
}: {
  open: boolean;
  onClose: () => void;
  anchor: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: "left" | "right";
  width?: number;
  label: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const target = useContext(PortalContext);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const el = panel.current;
    const a = anchor.current;
    if (!open || !el || !a || !target) return;
    const ar = a.getBoundingClientRect();
    const cr = target.getBoundingClientRect();
    const sx = cr.width / (target.offsetWidth || cr.width) || 1;
    const sy = cr.height / (target.offsetHeight || cr.height) || 1;
    const top = (ar.bottom - cr.top) / sy + 10;
    const maxH = (cr.bottom - ar.bottom) / sy - 24;
    el.style.top = `${top}px`;
    el.style.maxHeight = `${Math.max(180, maxH)}px`;
    if (align === "right") {
      el.style.left = `${Math.max(8, (ar.right - cr.left) / sx - width)}px`;
    } else {
      el.style.left = `${Math.min((ar.left - cr.left) / sx, cr.width / sx - width - 8)}px`;
    }
  }, [open, anchor, target, align, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current();
        anchor.current?.focus();
      }
    };
    const onScroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      closeRef.current();
    };
    const onResize = () => closeRef.current();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, anchor]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.97, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{ width, transformOrigin: align === "right" ? "top right" : "top left" }}
            className="pointer-events-auto absolute z-[55] overflow-y-auto rounded-[20px] bg-card text-ink shadow-pop ring-1 ring-line v-scroll"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/*  Toasts                                                             */
/* ------------------------------------------------------------------ */

type ToastTone = "success" | "info" | "error";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastContext = createContext<(t: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((t: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => {
    counter.current += 1;
    const id = counter.current;
    setItems((list) => [...list.slice(-2), { id, tone: "success", ...t }]);
    window.setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 3600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <Portal>
        <div
          className="pointer-events-none absolute bottom-6 right-6 z-[70] flex w-[min(360px,calc(100%-32px))] flex-col gap-2"
          role="status"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {items.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="pointer-events-auto flex items-start gap-3 rounded-[18px] bg-pill px-4 py-3 text-pill-fg shadow-pop"
              >
                <span
                  aria-hidden
                  className={cx(
                    "mt-[5px] h-2 w-2 shrink-0 rounded-full",
                    t.tone === "success" ? "bg-[#3CCB8B]" : t.tone === "error" ? "bg-[#F0646A]" : "bg-accent",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12px] opacity-70">{t.description}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}
