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
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-[#F7F9F5] text-[#24352D] antialiased`}
      >
        {/* Skip Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#176B4D] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-[#237A57] focus:ring-offset-2"
        >
          Skip to main content
        </a>

        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-[#E5EBE6] bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE9DF] bg-[#EAF3ED] text-[#237A57]"
                >
                  <Wind className="h-5 w-5" strokeWidth={2} />
                </span>

                <div className="flex flex-col">
                  <p className="text-[17px] font-semibold tracking-tight text-[#24352D]">
                    VayuGuard
                  </p>
                  <p className="hidden text-[11px] font-medium tracking-[0.08em] text-[#87938A] sm:block">
                    URBAN AIR QUALITY ASSISTANT
                  </p>
                </div>
              </div>

              {/* Technology Indicator */}
              <div className="flex items-center gap-2 rounded-full border border-[#E5EBE6] bg-[#F7F9F5] px-3 py-2">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-[#36966B]"
                />

                <span className="text-[11px] font-medium text-[#68756D] sm:text-xs">
                  <span className="hidden sm:inline">
                    Open-Meteo
                    <span className="mx-1.5 text-[#B8C2BA]">·</span>
                    Gemini AI
                  </span>
                  <span className="sm:hidden">AI Powered</span>
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main
            id="main-content"
            className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
          >
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#E5EBE6] bg-white">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2">
                <Wind
                  className="h-4 w-4 shrink-0 text-[#237A57]"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-[#68756D]">
                  Air quality telemetry via Open-Meteo. Action plans generated
                  with Google Gemini.
                </p>
              </div>

              <p className="max-w-xl text-xs leading-relaxed text-[#87938A] sm:text-right">
                Informational guidance only — consult a healthcare professional
                for acute respiratory symptoms.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
