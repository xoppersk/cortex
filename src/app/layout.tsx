import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sevyn App Starter",
    template: "%s · Sevyn App Starter",
  },
  description:
    "Production-ready Next.js + Supabase starter: auth, Postgres with Row Level Security, app shell, and CI gates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
