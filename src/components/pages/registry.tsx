"use client";

import type { ReactNode } from "react";
import { OverviewPage } from "./overview/OverviewPage";
import { ActivityPage } from "./activity/ActivityPage";
import { ManagePage } from "./manage/ManagePage";
import { ContactsPage } from "./contacts/ContactsPage";
import { SavingsPage } from "./savings/SavingsPage";
import { ProgramPage } from "./secondary/ProgramPage";
import { AccountPage } from "./secondary/AccountPage";
import { ReportsPage } from "./secondary/ReportsPage";
import { SchedulePage } from "./secondary/SchedulePage";
import { InboxPage } from "./secondary/InboxPage";
import { NotFoundPage } from "./secondary/NotFoundPage";

/** Maps a dashboard pathname to its page. The shell renders this inside AnimatePresence. */
export function renderPage(pathname: string): ReactNode {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  switch (clean) {
    case "/":
      return <OverviewPage />;
    case "/activity":
      return <ActivityPage />;
    case "/manage":
      return <ManagePage />;
    case "/contacts":
      return <ContactsPage />;
    case "/savings":
      return <SavingsPage />;
    case "/program":
      return <ProgramPage />;
    case "/account":
      return <AccountPage />;
    case "/reports":
      return <ReportsPage />;
    case "/schedule":
      return <SchedulePage />;
    case "/inbox":
      return <InboxPage />;
    default:
      return <NotFoundPage />;
  }
}
