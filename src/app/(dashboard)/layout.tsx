import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/**
 * Every dashboard route shares one persistent shell. The shell renders the page for the current
 * pathname itself (see components/pages/registry), which lets AnimatePresence play exit
 * transitions while the header and rail stay put. Route files only provide URLs + metadata.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
