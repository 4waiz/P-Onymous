export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";
export type DisplayCurrency = "USD" | "EUR" | "GBP";

export interface Wallet {
  id: string;
  code: CurrencyCode;
  balance: number;
  limit: number;
  active: boolean;
}

export type TxStatus = "Completed" | "Pending" | "In Progress";

export type TxIcon =
  | "app"
  | "hotel"
  | "flight"
  | "grocery"
  | "software"
  | "salary"
  | "rent"
  | "cloud"
  | "transfer"
  | "food"
  | "ads"
  | "equipment"
  | "insurance"
  | "refund"
  | "design"
  | "consulting"
  | "utilities"
  | "request"
  | "savings"
  | "bill";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  direction: "in" | "out";
  status: TxStatus;
  /** Local wall-clock timestamp, `YYYY-MM-DDTHH:mm` (kept timezone-free on purpose). */
  at: string;
  icon: TxIcon;
  counterparty?: string;
}

export interface Contact {
  id: string;
  name: string;
  short: string;
  initials: string;
  handle: string;
  kind: "Person" | "Business";
  bank: string;
  last4: string;
  lastSentAmount: number | null;
  /** `YYYY-MM-DD` */
  lastSentAt: string | null;
  favourite: boolean;
  gradient: [string, string];
}

export type GoalIcon = "laptop" | "plane" | "shield" | "car" | "gift" | "home" | "heart" | "camera";
export type GoalTone = "coral" | "blue" | "green" | "purple" | "pink" | "amber";

export interface Goal {
  id: string;
  name: string;
  icon: GoalIcon;
  tone: GoalTone;
  /** `YYYY-MM` */
  due: string;
  saved: number;
  target: number;
}

export interface Contribution {
  month: string;
  amount: number;
}

export interface CardControls {
  online: boolean;
  contactless: boolean;
  atm: boolean;
  abroad: boolean;
}

export type CardColor = "black" | "coral" | "lilac";

export interface PaymentCard {
  id: string;
  label: string;
  number: string;
  last4: string;
  expiry: string;
  cvv: string;
  color: CardColor;
  frozen: boolean;
  controls: CardControls;
  limit: number;
  spent: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "payment" | "security" | "goal" | "request";
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  /** `YYYY-MM-DD` */
  due: string;
  category: "Utilities" | "Rent" | "Subscription" | "Insurance" | "Internet";
  paid: boolean;
  autopay: boolean;
}

export interface Message {
  id: string;
  from: string;
  initials: string;
  gradient: [string, string];
  subject: string;
  preview: string;
  at: string;
  read: boolean;
  starred: boolean;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  country: string;
  twoFactor: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyDigest: boolean;
}

export interface AppState {
  version: number;
  balanceUSD: number;
  balanceDelta: number;
  currency: DisplayCurrency;
  wallets: Wallet[];
  stats: { earnings: number; spending: number; income: number; revenue: number };
  pnl: { month: string; loss: number; profit: number }[];
  transactions: Transaction[];
  contacts: Contact[];
  goals: Goal[];
  contributions: Contribution[];
  autoSave: { roundUps: boolean; paydayBoost: boolean; weekly50: boolean };
  cards: PaymentCard[];
  selectedCardId: string;
  notifications: AppNotification[];
  bills: Bill[];
  messages: Message[];
  profile: Profile;
  rewards: { points: number; redeemed: string[]; enrolled: string[] };
  signedOut: boolean;
  seq: number;
}
