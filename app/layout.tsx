import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chimera Labs",
  description: "We build tools that make AI scraping economically irrational.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
