import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const condensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  // Only the /showcase stage uses the condensed + mono faces; don't preload them everywhere.
  preload: false,
});
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "71Codes — Live 3D business dashboards", template: "%s · 71Codes" },
  description:
    "71Codes turns your business data into a live, animated 3D world — orders, money, customers and goals you can orbit, click and watch move.",
};

export const viewport: Viewport = {
  themeColor: "#e7e4e8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${condensed.variable} ${mono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
