"use client";

import { useState, useEffect } from "react";
import { Terminal, ShieldCheck, Cpu, Key, CheckCircle, XCircle } from "lucide-react";

interface Props {
  targetUrl: string;
  onSuccess: (proofData: string) => void;
  onClose: () => void;
}

export default function ZkVerificationModal({ targetUrl, onSuccess, onClose }: Props) {
  const [step, setStep] = useState(0);

  const logs = [
    "Initializing zkPass browser node...",
    "Intercepting local TLS traffic...",
    `Capturing secure state for: ${targetUrl}`,
    "Executing zero-knowledge circuits...",
    "Generating cryptographic proof receipt...",
    "Verifying math constraints locally...",
    "Proof Generated Successfully! Sending to ASP Oracle."
  ];

  useEffect(() => {
    if (step < logs.length) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 800 + Math.random() * 600); // Random delay between 800ms and 1400ms
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        // Return a mocked proof string
        onSuccess(JSON.stringify({ mockSuccess: true, timestamp: Date.now() }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, logs.length, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden border border-white/10 rounded-xl bg-black/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white/90 text-sm">ZK-Proof Verification</h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-6 font-mono text-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-white/80">Local Browser Oracle (zkPass)</div>
              <div className="text-white/40 text-xs">Computing ZK-SNARK...</div>
            </div>
          </div>

          <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto border border-white/5">
            {logs.slice(0, step + 1).map((log, index) => (
              <div key={index} className="flex gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-emerald-500/80">❯</span>
                <span className={index === logs.length - 1 ? "text-emerald-400 font-semibold" : "text-white/60"}>
                  {log}
                </span>
              </div>
            ))}
            {step < logs.length && (
              <div className="flex gap-2 animate-pulse mt-2">
                <span className="text-emerald-500/80">❯</span>
                <span className="text-white/40">_</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Key className="w-4 h-4" />
            Zero-Knowledge Cryptography ensures privacy.
          </div>
          {step >= logs.length && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Verified
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
