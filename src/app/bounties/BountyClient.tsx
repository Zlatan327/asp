"use client";

import { useState } from "react";
import { Bot, CheckCircle, Zap, Shield, Loader2, Coins } from "lucide-react";
import ZkVerificationModal from "@/components/ZkVerificationModal";

export default function BountyClient({ initialBounties, userId, botUnlocked, srs, tasksCompleted }: any) {
  const [bounties, setBounties] = useState(initialBounties);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [autoBotActive, setAutoBotActive] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const handleVerifyClick = (bounty: any) => {
    setTargetUrl(bounty.targetUrl);
    setVerifyingId(bounty.id);
  };

  const onZkSuccess = async (proofData: string) => {
    if (!verifyingId) return;
    setClaiming(verifyingId);
    const id = verifyingId;
    setVerifyingId(null);

    try {
      const res = await fetch(`/api/bounties/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofData })
      });

      if (res.ok) {
        setBounties((prev: any) => 
          prev.map((b: any) => b.id === id ? { ...b, participantsCount: b.participantsCount + 1 } : b)
        );
        alert("Bounty claimed successfully! Payout secured on X Layer.");
      } else {
        const error = await res.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (e) {
      alert("Error claiming bounty");
    } finally {
      setClaiming(null);
    }
  };

  const handleBotToggle = () => {
    if (!botUnlocked) {
      alert("You need 10+ completed tasks and 90+ SRS to unlock the Auto-Bot!");
      return;
    }
    setAutoBotActive(!autoBotActive);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Social Bounty Hub
            </h1>
            <p className="text-white/60 mt-2">Complete micro-tasks. Verify via ZK-Proofs. Earn instant USDT.</p>
          </div>

          {/* User Stats & Bot Toggle */}
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex flex-col">
              <span className="text-xs text-white/50">Your SRS</span>
              <span className="font-mono text-emerald-400">{srs}/100</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-xs text-white/50">Tasks</span>
              <span className="font-mono text-cyan-400">{tasksCompleted}</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <button 
              onClick={handleBotToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                autoBotActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                : botUnlocked ? "bg-white/10 hover:bg-white/20 text-white" 
                : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
            >
              <Bot className="w-4 h-4" />
              {autoBotActive ? "Auto-Bot Active" : "Enable Auto-Bot"}
            </button>
          </div>
        </div>

        {/* Bounties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.map((bounty: any) => (
            <div key={bounty.id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col hover:border-emerald-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2 py-1 rounded">
                  {bounty.platform} • {bounty.action}
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Coins className="w-4 h-4" />
                  {bounty.rewardAmount} USDT
                </div>
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{bounty.title}</h3>
              <p className="text-white/60 text-sm mb-6 flex-grow">{bounty.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <div className="text-xs text-white/40">
                  {bounty.participantsCount} / {bounty.maxParticipants} Claimed
                </div>
                <button 
                  onClick={() => handleVerifyClick(bounty)}
                  disabled={claiming === bounty.id || autoBotActive}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {claiming === bounty.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying</>
                  ) : autoBotActive ? (
                    <><Bot className="w-4 h-4 text-emerald-400" /> Bot Handled</>
                  ) : (
                    <><Shield className="w-4 h-4" /> ZK Verify</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {bounties.length === 0 && (
          <div className="text-center py-20 border border-white/5 border-dashed rounded-xl">
            <Zap className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white/80 font-semibold">No active bounties right now</h3>
            <p className="text-white/40 text-sm">Check back later for more micro-tasks.</p>
          </div>
        )}

      </div>

      {verifyingId && (
        <ZkVerificationModal 
          targetUrl={targetUrl}
          onSuccess={onZkSuccess}
          onClose={() => setVerifyingId(null)}
        />
      )}
    </div>
  );
}
