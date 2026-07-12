'use client';

import { useState } from 'react';
import { EscrowService } from '@/lib/blockchain/contracts';

export default function EscrowPanel({ gig, isClient, onEscrowCreated }: { gig: any; isClient: boolean; onEscrowCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const handleFundEscrow = async () => {
    try {
      setLoading(true);
      setStatusText('Minting Test USDT to your wallet...');
      // 1. Mint test USDT to the client
      await EscrowService.mintTestUSDT(gig.budget.toString());
      
      setStatusText('Deploying new Escrow Contract...');
      // 2. Create the Escrow via Factory
      const escrowAddress = await EscrowService.createEscrow(gig.freelancer.walletAddress || gig.freelancerId, gig.budget.toString(), 1);
      
      setStatusText('Funding Escrow (Approve & Transfer)...');
      // 3. Fund it
      await EscrowService.fundEscrow(escrowAddress, gig.budget.toString());
      
      setStatusText('Syncing with platform...');
      // 4. Save to DB
      await fetch(`/api/gigs/${gig.id}/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowAddress })
      });
      
      setStatusText('Done!');
      onEscrowCreated();
    } catch (err: any) {
      console.error(err);
      alert('Transaction failed: ' + err.message);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!gig.escrowContractAddress) return;
    try {
      setLoading(true);
      setStatusText('Releasing funds to freelancer...');
      await EscrowService.releaseMilestone(gig.escrowContractAddress, 0); // Index 0 for 1 milestone
      
      setStatusText('Finalizing gig and calculating reputation score...');
      const res = await fetch(`/api/gigs/${gig.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientRating: rating, clientFeedback: feedback || "Great job!" })
      });
      const data = await res.json();
      
      if (data.tokenURI) {
        setStatusText('Minting/Updating Reputation SBT on-chain...');
        const hasSbt = await EscrowService.checkHasReputationSBT(gig.freelancer.walletAddress || gig.freelancerId);
        if (hasSbt) {
          await EscrowService.updateReputationSBT(gig.freelancer.walletAddress || gig.freelancerId, data.tokenURI);
        } else {
          await EscrowService.mintReputationSBT(gig.freelancer.walletAddress || gig.freelancerId, data.tokenURI);
        }
      }

      alert('Gig completed and Reputation SBT issued!');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Release failed: ' + err.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  if (!gig.escrowContractAddress) {
    if (isClient) {
      return (
        <div className="card" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Secure Escrow</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            The proposal has been accepted! To begin work, please lock the agreed budget of <strong>{gig.budget} USDT</strong> into a secure X Layer smart contract.
          </p>
          <button className="btn btn-primary w-full" onClick={handleFundEscrow} disabled={loading}>
            {loading ? statusText : 'Deploy & Fund Escrow'}
          </button>
        </div>
      );
    } else {
      return (
        <div className="card" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Awaiting Funding</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            You've been hired! Please wait for the client to lock the {gig.budget} USDT into the smart contract before you begin work.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Active Escrow</h2>
      <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Contract: <span style={{ fontFamily: 'monospace' }}>{gig.escrowContractAddress}</span>
        <br/>
        Status: <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Funded ({gig.budget} USDT)</span>
      </div>
      
      {isClient && gig.status === 'IN_PROGRESS' && (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Rating (1-5)</label>
            <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input w-full" disabled={loading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Leave a review for the freelancer..." className="input w-full" rows={3} disabled={loading} />
          </div>
          <button className="btn btn-primary w-full" onClick={handleRelease} disabled={loading}>
            {loading ? statusText : 'Approve Work & Release Payment'}
          </button>
        </div>
      )}
      {!isClient && gig.status === 'IN_PROGRESS' && (
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Work on your deliverables. Once submitted, the client will release the payment here.
        </p>
      )}
    </div>
  );
}
