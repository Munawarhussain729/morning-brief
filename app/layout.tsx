import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Brief",
  description: "AI and tech morning brief for macOS"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
