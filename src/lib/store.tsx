"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { FX, SEED } from "./data";
import type {
  AppState,
  CardColor,
  CardControls,
  Contact,
  DisplayCurrency,
  Goal,
  GoalIcon,
  GoalTone,
  Profile,
  Transaction,
} from "./types";

export type Action =
  | { type: "setCurrency"; currency: DisplayCurrency }
  | { type: "sendTransfer"; contactId: string; amount: number; note?: string; at: string }
  | { type: "requestMoney"; contactId: string; amount: number; note?: string; at: string }
  | { type: "toggleFavourite"; id: string }
  | {
      type: "addContact";
      contact: Pick<Contact, "name" | "handle" | "kind" | "bank" | "last4" | "favourite">;
    }
  | { type: "addGoal"; name: string; target: number; due: string; icon: GoalIcon; initial: number; at: string }
  | { type: "addMoney"; goalId: string; amount: number; at: string }
  | { type: "toggleAutoSave"; key: keyof AppState["autoSave"] }
  | { type: "selectCard"; id: string }
  | { type: "toggleFreeze"; id: string }
  | { type: "setControl"; id: string; key: keyof CardControls; value: boolean }
  | { type: "setLimit"; id: string; limit: number }
  | { type: "addCard"; color: CardColor; label: string }
  | { type: "toggleWallet"; id: string }
  | { type: "readNotifications" }
  | { type: "readNotification"; id: string }
  | { type: "payBill"; id: string; at: string }
  | { type: "toggleAutopay"; id: string }
  | { type: "readMessage"; id: string }
  | { type: "toggleStar"; id: string }
  | { type: "updateProfile"; patch: Partial<Profile> }
  | { type: "redeemReward"; id: string; cost: number }
  | { type: "toggleEnroll"; id: string }
  | { type: "signOut" }
  | { type: "signIn" }
  | { type: "reset" };

const GRADIENTS: [string, string][] = [
  ["#F4A261", "#E57A3C"],
  ["#5B8DEF", "#3B53D6"],
  ["#D46BF5", "#9B3BE3"],
  ["#6BE3A8", "#2DBE86"],
  ["#F2647E", "#D93A5E"],
  ["#5CC8E8", "#2F8FD0"],
  ["#E9DC5A", "#C9B52C"],
];

const TONES: GoalTone[] = ["coral", "blue", "green", "purple", "pink", "amber"];

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function nextInvoice(state: AppState) {
  return `INV_${String(state.seq).padStart(6, "0")}`;
}

function cardNumberFor(seq: number) {
  // Deterministic demo-only card numbers (never real PANs).
  const block = (n: number) => String(n % 10000).padStart(4, "0");
  const a = 5300 + (seq * 37) % 600;
  const b = (seq * 7919) % 10000;
  const c = (seq * 104729) % 10000;
  const d = (seq * 1299709 + 4021) % 10000;
  return `${block(a)} ${block(b)} ${block(c)} ${block(d)}`;
}

function debitUSD(state: AppState, amount: number): Pick<AppState, "balanceUSD" | "wallets"> {
  return {
    balanceUSD: Math.round((state.balanceUSD - amount) * 100) / 100,
    wallets: state.wallets.map((w) =>
      w.code === "USD" ? { ...w, balance: Math.round((w.balance - amount) * 100) / 100 } : w,
    ),
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "setCurrency":
      return { ...state, currency: action.currency };

    case "sendTransfer": {
      const contact = state.contacts.find((c) => c.id === action.contactId);
      if (!contact || action.amount <= 0 || action.amount > state.balanceUSD) return state;
      const tx: Transaction = {
        id: nextInvoice(state),
        title: `Transfer to ${contact.name}`,
        amount: action.amount,
        direction: "out",
        status: "Completed",
        at: action.at,
        icon: "transfer",
        counterparty: contact.name,
      };
      return {
        ...state,
        ...debitUSD(state, action.amount),
        seq: state.seq + 1,
        stats: { ...state.stats, spending: state.stats.spending + action.amount },
        transactions: [tx, ...state.transactions],
        contacts: state.contacts.map((c) =>
          c.id === contact.id ? { ...c, lastSentAmount: action.amount, lastSentAt: action.at.slice(0, 10) } : c,
        ),
        notifications: [
          {
            id: `n-${state.seq}`,
            title: "Transfer sent",
            body: `You sent ${action.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })} to ${contact.name}.`,
            at: action.at,
            read: false,
            kind: "payment",
          },
          ...state.notifications,
        ],
      };
    }

    case "requestMoney": {
      const contact = state.contacts.find((c) => c.id === action.contactId);
      if (!contact || action.amount <= 0) return state;
      const tx: Transaction = {
        id: nextInvoice(state),
        title: `Request from ${contact.name}`,
        amount: action.amount,
        direction: "in",
        status: "Pending",
        at: action.at,
        icon: "request",
        counterparty: contact.name,
      };
      return { ...state, seq: state.seq + 1, transactions: [tx, ...state.transactions] };
    }

    case "toggleFavourite":
      return {
        ...state,
        contacts: state.contacts.map((c) => (c.id === action.id ? { ...c, favourite: !c.favourite } : c)),
      };

    case "addContact": {
      const { name, handle, kind, bank, last4, favourite } = action.contact;
      const contact: Contact = {
        id: `c-${state.seq}`,
        name: name.trim(),
        short: name.trim().split(/\s+/)[0],
        initials: initialsOf(name),
        handle: handle.trim() || `@${name.trim().split(/\s+/)[0].toLowerCase()}`,
        kind,
        bank,
        last4,
        lastSentAmount: null,
        lastSentAt: null,
        favourite,
        gradient: GRADIENTS[state.seq % GRADIENTS.length],
      };
      return { ...state, seq: state.seq + 1, contacts: [...state.contacts, contact] };
    }

    case "addGoal": {
      const initial = Math.max(0, Math.min(action.initial, state.balanceUSD));
      const goal: Goal = {
        id: `g-${state.seq}`,
        name: action.name.trim(),
        icon: action.icon,
        tone: TONES[state.goals.length % TONES.length],
        due: action.due,
        saved: initial,
        target: action.target,
      };
      const contributions = state.contributions.map((c, i, arr) =>
        i === arr.length - 1 ? { ...c, amount: c.amount + initial } : c,
      );
      return {
        ...state,
        ...(initial > 0 ? debitUSD(state, initial) : {}),
        seq: state.seq + 1,
        goals: [...state.goals, goal],
        contributions,
      };
    }

    case "addMoney": {
      const goal = state.goals.find((g) => g.id === action.goalId);
      if (!goal || action.amount <= 0 || action.amount > state.balanceUSD) return state;
      const tx: Transaction = {
        id: nextInvoice(state),
        title: `Saved to ${goal.name}`,
        amount: action.amount,
        direction: "out",
        status: "Completed",
        at: action.at,
        icon: "savings",
      };
      return {
        ...state,
        ...debitUSD(state, action.amount),
        seq: state.seq + 1,
        transactions: [tx, ...state.transactions],
        goals: state.goals.map((g) => (g.id === goal.id ? { ...g, saved: g.saved + action.amount } : g)),
        contributions: state.contributions.map((c, i, arr) =>
          i === arr.length - 1 ? { ...c, amount: c.amount + action.amount } : c,
        ),
      };
    }

    case "toggleAutoSave":
      return { ...state, autoSave: { ...state.autoSave, [action.key]: !state.autoSave[action.key] } };

    case "selectCard":
      return { ...state, selectedCardId: action.id };

    case "toggleFreeze":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.id ? { ...c, frozen: !c.frozen } : c)),
      };

    case "setControl":
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, controls: { ...c.controls, [action.key]: action.value } } : c,
        ),
      };

    case "setLimit":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.id ? { ...c, limit: action.limit } : c)),
      };

    case "addCard": {
      const number = cardNumberFor(state.seq);
      const last4 = number.slice(-4);
      const month = String(((state.seq * 5) % 12) + 1).padStart(2, "0");
      const card = {
        id: `card-${last4}-${state.seq}`,
        label: action.label.trim() || "Virtual",
        number,
        last4,
        expiry: `${month}/30`,
        cvv: String(100 + ((state.seq * 389) % 900)),
        color: action.color,
        frozen: false,
        controls: { online: true, contactless: true, atm: false, abroad: false },
        limit: 2500,
        spent: 0,
      };
      return { ...state, seq: state.seq + 1, cards: [...state.cards, card], selectedCardId: card.id };
    }

    case "toggleWallet":
      return {
        ...state,
        wallets: state.wallets.map((w) => (w.id === action.id ? { ...w, active: !w.active } : w)),
      };

    case "readNotifications":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case "readNotification":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };

    case "payBill": {
      const bill = state.bills.find((b) => b.id === action.id);
      if (!bill || bill.paid || bill.amount > state.balanceUSD) return state;
      const tx: Transaction = {
        id: nextInvoice(state),
        title: bill.name,
        amount: bill.amount,
        direction: "out",
        status: "Completed",
        at: action.at,
        icon: "bill",
      };
      return {
        ...state,
        ...debitUSD(state, bill.amount),
        seq: state.seq + 1,
        transactions: [tx, ...state.transactions],
        bills: state.bills.map((b) => (b.id === bill.id ? { ...b, paid: true } : b)),
      };
    }

    case "toggleAutopay":
      return {
        ...state,
        bills: state.bills.map((b) => (b.id === action.id ? { ...b, autopay: !b.autopay } : b)),
      };

    case "readMessage":
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, read: true } : m)),
      };

    case "toggleStar":
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, starred: !m.starred } : m)),
      };

    case "updateProfile":
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case "redeemReward":
      if (state.rewards.points < action.cost || state.rewards.redeemed.includes(action.id)) return state;
      return {
        ...state,
        rewards: {
          ...state.rewards,
          points: state.rewards.points - action.cost,
          redeemed: [...state.rewards.redeemed, action.id],
        },
      };

    case "toggleEnroll": {
      const enrolled = state.rewards.enrolled.includes(action.id)
        ? state.rewards.enrolled.filter((e) => e !== action.id)
        : [...state.rewards.enrolled, action.id];
      return { ...state, rewards: { ...state.rewards, enrolled } };
    }

    case "signOut":
      return { ...state, signedOut: true };

    case "signIn":
      return { ...state, signedOut: false };

    case "reset":
      return SEED;
  }
}

/* ------------------------------------------------------------------ */
/*  External store (useSyncExternalStore) with optional localStorage   */
/* ------------------------------------------------------------------ */

export interface Store {
  getState(): AppState;
  getServerState(): AppState;
  dispatch(action: Action): void;
  subscribe(listener: () => void): () => void;
}

export function createStore(persistKey?: string): Store {
  let state: AppState = SEED;
  let loaded = !persistKey;
  const listeners = new Set<() => void>();

  const load = () => {
    if (!persistKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(persistKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed && parsed.version === SEED.version) state = { ...SEED, ...parsed } as AppState;
      // Saved demo data from before the profile email changed: adopt the new default address.
      if (state.profile.email === "hello@codext.studio") state = { ...state, profile: { ...state.profile, email: SEED.profile.email } };
    } catch {
      /* corrupted or blocked storage: keep seed */
    }
  };

  const ensureLoaded = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    load();
  };

  const emit = () => listeners.forEach((l) => l());

  const onStorage = (e: StorageEvent) => {
    if (e.key !== persistKey) return;
    load();
    if (!e.newValue) state = SEED;
    emit();
  };

  return {
    getState() {
      ensureLoaded();
      return state;
    },
    getServerState() {
      return SEED;
    },
    dispatch(action) {
      ensureLoaded();
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      if (persistKey) {
        try {
          window.localStorage.setItem(persistKey, JSON.stringify(state));
        } catch {
          /* storage full or blocked — state still lives in memory */
        }
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (persistKey && listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (persistKey && listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export const appStore = createStore("71codes:state:v4");

const StoreContext = createContext<Store>(appStore);

export function StoreProvider({ store, children }: { store: Store; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStoreApi() {
  return useContext(StoreContext);
}

export function useAppState(): AppState {
  const store = useContext(StoreContext);
  return useSyncExternalStore(store.subscribe, store.getState, store.getServerState);
}

export function useDispatch() {
  return useContext(StoreContext).dispatch;
}

const noopSubscribe = () => () => {};
/** `false` during SSR + hydration, `true` afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function convert(usd: number, currency: string) {
  return usd * (FX[currency] ?? 1);
}
