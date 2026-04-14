import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fulcrum — Build the life you've designed",
  description:
    "Fulcrum helps you set goals, build habits, track deep work sessions, and measure what actually matters — so progress becomes inevitable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ── Global ambient background blobs ─────────────────────────────
            Fixed so they stay in place across all pages and scroll.
            Opacity is intentionally low — purely decorative depth.        */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
        >
          {/* Top-center — purple/indigo */}
          <div
            className="absolute -top-64 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-[0.15] dark:opacity-[0.07]"
            style={{
              background:
                "radial-gradient(circle at center, oklch(0.6 0.25 280) 0%, transparent 70%)",
            }}
          />
          {/* Bottom-right — pink/rose */}
          <div
            className="absolute bottom-0 right-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/4 rounded-full opacity-[0.10] dark:opacity-[0.05]"
            style={{
              background:
                "radial-gradient(circle at center, oklch(0.65 0.22 320) 0%, transparent 70%)",
            }}
          />
          {/* Mid-left — emerald/teal */}
          <div
            className="absolute top-1/2 left-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] dark:opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle at center, oklch(0.65 0.2 160) 0%, transparent 70%)",
            }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}