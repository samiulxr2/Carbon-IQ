import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarbonIQ-MRV | ClimateSphere AI Intelligence Platform",
  description: "AI-Powered Measurement, Reporting & Verification for Article 6 Carbon Credits & Fraud Auditing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060D0A] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-[#060D0A]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              <span className="text-lg">🌿</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">CarbonIQ<span className="text-emerald-400">-MRV</span></span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Article 6.2 Certified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Satellite Proxy + IoT Sensor Fraud Detection & Decarbonization AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1914] border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">MCP Tool Server:</span>
              <span className="text-emerald-400 font-semibold">ONLINE (5 Tools)</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1914] border border-cyan-500/20">
              <span className="text-slate-300">SHA-256 Ledger:</span>
              <span className="text-cyan-400 font-semibold">100% VERIFIED</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-emerald-500/20 bg-[#060D0A] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">CarbonIQ-MRV v1.0</span>
            <span>•</span>
            <span className="text-amber-400/90 font-medium tracking-wide">Demo / Synthetic Data</span>
          </div>
          <div className="text-slate-400 text-center sm:text-right">
            ClimateSphere AI / CarbonIQ Challenge • Ministry of Environment, Forest & Climate Change (MoEFCC)
          </div>
        </footer>
      </body>
    </html>
  );
}
