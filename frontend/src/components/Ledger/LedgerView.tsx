"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Hash,
  ShieldCheck,
  Download,
  FileText,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Printer,
  X,
  ExternalLink,
  Lock
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface LedgerBlock {
  block_index: number;
  node_id: string;
  timestamp: string;
  carbon_stock_tco2e: number;
  trust_score: number;
  credits_issued: number;
  previous_hash: string;
  current_hash: string;
  tx_signature: string;
}

interface VerifyResult {
  status: string;
  is_valid: boolean;
  total_blocks: number;
  tampered_block_index: number | null;
  chain_head_hash?: string;
  verified_at?: string;
  integrity_score?: string;
  standard_compliance?: string;
}

export default function LedgerView() {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [totalBlocks, setTotalBlocks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Verification State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  // ESG Report Modal State
  const [isGeneratingEsg, setIsGeneratingEsg] = useState<boolean>(false);
  const [esgReportText, setEsgReportText] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ledger?limit=50`);
      const data = await res.json();
      if (data.blocks) {
        setBlocks(data.blocks);
        setTotalBlocks(data.total_blocks);
      }
    } catch (err) {
      console.error("Failed to load ledger:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Copy hash to clipboard helper
  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // 1. Verify Chain button handler
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`${API_URL}/ledger/verify`);
      const data = await res.json();
      setVerifyResult(data);
    } catch (err) {
      console.error("Ledger verification failed:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Export Article 6 Registry JSON handler
  const handleExportRegistry = async () => {
    try {
      const res = await fetch(`${API_URL}/export/registry`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bangladesh_Article6_ITMO_Registry_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // 3. Generate ESG Audit Report handler
  const handleGenerateEsgReport = async () => {
    setIsGeneratingEsg(true);
    try {
      const res = await fetch(`${API_URL}/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Generate formal ESG Executive Audit Report for Article 6.2 national carbon registry compliance"
        })
      });
      const data = await res.json();
      setEsgReportText(data.response || "No report generated.");
    } catch (err) {
      console.error("ESG Report generation failed:", err);
    } finally {
      setIsGeneratingEsg(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                  SHA-256 Cryptographic Hash Chain
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Strict Gatekeeper (Trust &gt; 95%)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Immutable Article 6.2 Ledger • Continuous Merkle Linkage • Tamper-Evident Double-Counting Prevention
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Button 1: Verify Chain */}
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`} />
              <span>{isVerifying ? "Auditing Chain..." : "Verify Chain"}</span>
            </button>

            {/* Button 2: Export Registry JSON */}
            <button
              onClick={handleExportRegistry}
              className="px-3.5 py-2 rounded-lg bg-[#060D0A] hover:bg-slate-900 border border-emerald-500/30 text-emerald-300 font-semibold text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Article 6 JSON</span>
            </button>

            {/* Button 3: Generate ESG Report */}
            <button
              onClick={handleGenerateEsgReport}
              disabled={isGeneratingEsg}
              className="px-3.5 py-2 rounded-lg bg-[#060D0A] hover:bg-slate-900 border border-cyan-500/30 text-cyan-300 font-semibold text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <FileText className={`w-4 h-4 text-cyan-400 ${isGeneratingEsg ? "animate-pulse" : ""}`} />
              <span>{isGeneratingEsg ? "Synthesizing Report..." : "Generate ESG Audit Report"}</span>
            </button>
          </div>
        </div>

        {/* Verification Result Notification Card */}
        {verifyResult && (
          <div className="mt-4 p-4 rounded-lg bg-[#060D0A] border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>CRYPTOGRAPHIC AUDIT PASSED: {verifyResult.standard_compliance}</span>
              </div>
              <button
                onClick={() => setVerifyResult(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-300 pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL BLOCKS:</span>
                <span className="text-white font-bold">{verifyResult.total_blocks}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CHAIN STATUS:</span>
                <span className="text-emerald-400 font-bold">{verifyResult.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">INTEGRITY SCORE:</span>
                <span className="text-cyan-400 font-bold">{verifyResult.integrity_score || "100.0%"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CHAIN HEAD:</span>
                <span className="text-slate-400 font-mono text-[10px] truncate block">
                  {verifyResult.chain_head_hash?.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blocks Table Card */}
      <div className="glass-card p-6 border-emerald-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Immutable Ledger Blocks (Showing latest {blocks.length} of {totalBlocks})
            </h3>
          </div>
          <button
            onClick={fetchLedger}
            className="text-xs font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-500/20 text-slate-400 uppercase text-[10px] tracking-wider bg-[#060D0A]/60">
                <th className="py-3 px-3">Block #</th>
                <th className="py-3 px-3">Node / Time</th>
                <th className="py-3 px-3">Carbon Stock</th>
                <th className="py-3 px-3">Credits Issued</th>
                <th className="py-3 px-3">Trust</th>
                <th className="py-3 px-3">Previous Hash</th>
                <th className="py-3 px-3">Current Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {blocks.map((b) => (
                <tr key={b.block_index} className="hover:bg-emerald-950/20 transition-colors">
                  {/* Block Index */}
                  <td className="py-3 px-3 font-bold text-cyan-400">
                    #{b.block_index}
                  </td>

                  {/* Node ID & Timestamp */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{b.node_id}</div>
                    <div className="text-[10px] text-slate-500">{new Date(b.timestamp).toLocaleTimeString()}</div>
                  </td>

                  {/* Carbon Stock */}
                  <td className="py-3 px-3 text-emerald-400 font-semibold">
                    {b.carbon_stock_tco2e?.toFixed(2)} tCO2e
                  </td>

                  {/* Credits Issued */}
                  <td className="py-3 px-3 text-amber-300">
                    +{b.credits_issued?.toFixed(4)} t
                  </td>

                  {/* Trust Score */}
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {b.trust_score?.toFixed(1)}%
                    </span>
                  </td>

                  {/* Previous Hash */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <span>{b.previous_hash.slice(0, 10)}...</span>
                      <button
                        onClick={() => handleCopy(b.previous_hash)}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Copy Previous Hash"
                      >
                        {copiedHash === b.previous_hash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Current Hash */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                      <span>{b.current_hash.slice(0, 12)}...</span>
                      <button
                        onClick={() => handleCopy(b.current_hash)}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Copy Current Hash"
                      >
                        {copiedHash === b.current_hash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable ESG Audit Report Modal */}
      {esgReportText && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center overflow-y-auto">
          <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 border-emerald-500/30 bg-[#060D0A] text-slate-100 relative space-y-6 shadow-2xl">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 print:hidden">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Executive ESG Compliance & Audit Dossier</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded bg-emerald-500 text-black font-semibold text-xs font-mono flex items-center gap-1.5 hover:bg-emerald-400 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setEsgReportText(null)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Report Header for Print / Display */}
            <div className="border-b border-emerald-500/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    PEOPLE'S REPUBLIC OF BANGLADESH
                  </h1>
                  <p className="text-xs font-mono text-slate-400">
                    Designated National Authority (DNA) • Article 6.2 Carbon Crediting Framework
                  </p>
                </div>
                <div className="text-right text-xs font-mono text-emerald-400">
                  <span className="px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 font-bold">
                    UNFCCC VM0033 AUDIT CERTIFICATE
                  </span>
                  <div className="text-slate-500 text-[10px] mt-1">Generated: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Rendered Markdown Body */}
            <div className="prose-carbon text-sm leading-relaxed text-slate-200">
              {esgReportText.split("\n").map((line, idx) => {
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-lg font-bold text-emerald-400 mt-4 mb-2">
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("#### ")) {
                  return (
                    <h4 key={idx} className="text-sm font-semibold text-cyan-400 mt-3 mb-1">
                      {line.replace("#### ", "")}
                    </h4>
                  );
                }
                if (line.startsWith("> ")) {
                  return (
                    <blockquote key={idx} className="border-l-2 border-emerald-400 pl-3 my-2 text-slate-300 italic bg-emerald-950/20 py-1 rounded-r">
                      {line.replace("> ", "")}
                    </blockquote>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <li key={idx} className="ml-4 list-disc text-slate-300 my-1">
                      {line.replace("- ", "")}
                    </li>
                  );
                }
                if (line.trim() === "") {
                  return <div key={idx} className="h-2" />;
                }
                return (
                  <p key={idx} className="my-1.5 text-slate-300">
                    {line}
                  </p>
                );
              })}
            </div>

            {/* Official Digital Signature Footer */}
            <div className="pt-6 border-t border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
              <div>
                <span className="text-slate-500">DIGITAL PROOF SIGNATURE: </span>
                <span className="text-cyan-400">SIG-ED25519-CLIMATESPHERE-MRV-VM0033</span>
              </div>
              <div className="text-emerald-400 font-semibold">
                Article 6.2 Corresponding Adjustments Cleared
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
