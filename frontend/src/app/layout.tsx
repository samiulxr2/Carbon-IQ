import type { Metadata } from "next";
import "./globals.css";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "CarbonIQ-MRV | Autonomous Measurement, Reporting & Verification",
  description:
    "AI-driven MRV platform for continuous soil and blue-carbon stock estimation, sensor fraud prevention, and Article 6 credit issuance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060D0A] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-[#060D0A]/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <div className="hidden sm:block border-l border-slate-800 pl-3">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Article 6.2 Standard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
            {/* Cluster Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-[6px] bg-[#0D1914] border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Cluster:</span>
              <span className="text-emerald-400 font-semibold">ACTIVE</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0D1914] border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Protocol:</span>
              <span className="text-emerald-400 font-semibold">ONLINE</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#0D1914] border border-slate-800">
              <span className="text-slate-400">Ledger:</span>
              <span className="text-cyan-400 font-semibold">VERIFIED</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 bg-[#060D0A] px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">CarbonIQ-MRV</span>
            <span>&bull;</span>
            <span className="text-amber-400/90 font-medium">Demo / Synthetic Data</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right text-[11px]">
            ClimateSphere AI &bull; Article 6 Digital MRV Framework
          </div>
        </footer>
      </body>
    </html>
  );
}
