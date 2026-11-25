import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Wind } from "lucide-react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VayuGuard | Urban Air Quality & Winter Smog Assistant",
  description:
    "GenAI-powered urban air quality assistant helping families and communities navigate severe winter smog with low-emission daily routines, indoor air hacks, and transparent impact breakdowns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-950"
        >
          Skip to main content
        </a>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-950/60 text-emerald-400"
                >
                  <Wind className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight text-zinc-100">
                    VayuGuard
                  </p>
                  <p className="text-xs text-zinc-400">
                    Urban Air Quality &amp; Winter Smog Assistant
                  </p>
                </div>
              </div>

              <span className="hidden rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300 sm:inline-block">
                Live Open-Meteo Telemetry + Gemini AI
              </span>
            </div>
          </header>

          <main
            id="main-content"
            className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6"
          >
            {children}
          </main>

          <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                Air quality telemetry via Open-Meteo. Action plans generated
                with Google Gemini.
              </p>
              <p>
                Informational guidance only &mdash; consult a healthcare
                professional for acute respiratory symptoms.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
