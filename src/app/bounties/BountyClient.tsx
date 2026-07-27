"use client";

import { useState } from "react";
import { Bot, Zap, Shield, Loader2, Coins } from "lucide-react";
import ZkVerificationModal from "@/components/ZkVerificationModal";
import { ethers } from "ethers";
import { getProvider, USDT_ADDRESS } from "@/lib/blockchain/contracts";
import { TEST_USDT_ABI } from "@/lib/blockchain/config";

export default function BountyClient({ initialBounties, botUnlocked, rentedBot: initialRentedBot, srs, tasksCompleted, hasTwitter, hasDiscord }: any) {
  const [bounties, setBounties] = useState(initialBounties);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [autoBotActive, setAutoBotActive] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [rentedBot, setRentedBot] = useState(Boolean(initialRentedBot));
  const [renting, setRenting] = useState(false);

  const persistRental = async (txHash: string, mode: "paid" | "demo") => {
    const res = await fetch("/api/autobot/rent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, mode })
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Failed to activate Auto-Bot rental");
    }
  };

  const payForAutoBot = async () => {
    const treasuryAddress = process.env.NEXT_PUBLIC_AUTOBOT_TREASURY_ADDRESS;
    const demoRentalEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTOBOT_RENTAL === "true";

    if (!treasuryAddress) {
      if (!demoRentalEnabled) {
        throw new Error("Auto-Bot treasury address is not configured.");
      }
      await persistRental(`demo-${Date.now()}`, "demo");
      return;
    }

    if (!ethers.isAddress(treasuryAddress)) {
      throw new Error("Configured Auto-Bot treasury address is invalid.");
    }

    const provider = await getProvider();
    const signer = await provider.getSigner();
    const token = new ethers.Contract(USDT_ADDRESS, TEST_USDT_ABI, signer);
    const decimals = Number(process.env.NEXT_PUBLIC_AUTOBOT_PAYMENT_DECIMALS || 18);
    const amount = ethers.parseUnits("50", decimals);
    const tx = await token.transfer(treasuryAddress, amount);
    const receipt = await tx.wait();
    await persistRental(receipt?.hash || tx.hash, "paid");
  };

  const handleVerifyClick = (bounty: any) => {
    if (bounty.platform === 'TWITTER' && !hasTwitter) {
      alert("You must connect your X (Twitter) account in your profile before verifying this bounty.");
      return;
    }
    if (bounty.platform === 'DISCORD' && !hasDiscord) {
      alert("You must connect your Discord account in your profile before verifying this bounty.");
      return;
    }
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
    } catch {
      alert("Error claiming bounty");
    } finally {
      setClaiming(null);
    }
  };

  const handleBotToggle = () => {
    if (!botUnlocked && !rentedBot) {
      if (confirm("You need 10+ completed tasks and 90+ SRS to organically unlock the Auto-Bot.\\n\\nWould you like to RENT the Auto-Bot for 50 USDT instead?")) {
        setRenting(true);
        payForAutoBot()
          .then(() => {
          setRenting(false);
          setRentedBot(true);
          setAutoBotActive(true);
          alert("Payment successful! Auto-Bot rented and activated.");
          })
          .catch((error) => {
            console.error(error);
            alert(error instanceof Error ? error.message : "Auto-Bot rental failed");
          })
          .finally(() => setRenting(false));
      }
      return;
    }
    setAutoBotActive(!autoBotActive);
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div>
            <div className="badge badge-success" style={{ marginBottom: 'var(--space-3)' }}>
              <Zap size={14} />
              Social Proof Rewards
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
              Social Bounty Hub
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Complete micro-tasks. Verify via ZK proofs. Earn instant USDT.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Your SRS</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-success)' }}>{srs}/100</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--color-border-subtle)' }} />
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Tasks</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>{tasksCompleted}</div>
            </div>
            <button 
              onClick={handleBotToggle}
              disabled={renting}
              className={autoBotActive ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ whiteSpace: 'nowrap' }}
            >
              {renting ? <Loader2 size={16} className="spin" /> : <Bot size={16} />}
              {renting ? "Processing 50 USDT..." : autoBotActive ? "Auto-Bot Active" : (botUnlocked || rentedBot) ? "Enable Auto-Bot" : "Rent Auto-Bot"}
            </button>
          </div>
        </div>

        <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
          {bounties.map((bounty: any) => (
            <div key={bounty.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <span className="badge badge-success">{bounty.platform} · {bounty.action}</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-success)', fontWeight: 800 }}>
                  <Coins size={16} />
                  {bounty.rewardAmount} USDT
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{bounty.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{bounty.description}</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  {bounty.participantsCount} / {bounty.maxParticipants} Claimed
                </div>
                <button 
                  onClick={() => handleVerifyClick(bounty)}
                  disabled={claiming === bounty.id || autoBotActive}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: claiming === bounty.id || autoBotActive ? 0.6 : 1 }}
                >
                  {claiming === bounty.id ? (
                    <><Loader2 size={16} className="spin" /> Verifying</>
                  ) : autoBotActive ? (
                    <><Bot size={16} /> Bot Handled</>
                  ) : (
                    <><Shield size={16} /> ZK Verify</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {bounties.length === 0 && (
          <div className="glass-card text-center" style={{ padding: 'var(--space-10)', borderStyle: 'dashed' }}>
            <Zap size={48} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>No active bounties right now</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Check back later for more micro-tasks.</p>
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
