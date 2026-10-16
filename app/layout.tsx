import "./globals.css";
import "lenis/dist/lenis.css";
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";

const sans = Inter_Tight({ subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = { title: "For Swara", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#112409" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={sans.className}>{children}</body>
    </html>
  );
}
