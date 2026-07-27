'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Activity, Bot, MessageSquare } from 'lucide-react';
import { ethers } from 'ethers';

export default function AgentLogViewer({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handlePublish = async (logId: string) => {
    setPublishingId(logId);
    try {
      // 1. Get attestation signature from backend
      const res = await fetch(`/api/agent-logs/${logId}/attest`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const { payload } = await res.json();

      // 2. Request user to send a 0-value transaction
      const { getProvider } = await import('@/lib/blockchain/contracts');
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: signer.address, // Send to self
        value: 0,
        data: payload
      });

      const receipt = await tx.wait();

      // 3. Save txHash to database
      const saveRes = await fetch(`/api/agent-logs/${logId}/attest`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: receipt?.hash })
      });
      if (!saveRes.ok) throw new Error('Failed to save txHash');

      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, output: { ...log.output, txHash: receipt?.hash } }
          : log
      ));

      alert('Successfully published Agent Log to X Layer!');
    } catch (err: any) {
      alert('Failed to publish: ' + (err.message || String(err)));
    } finally {
      setPublishingId(null);
    }
  };

  const getIcon = (agentType: string) => {
    switch (agentType) {
      case 'SCOUT': return <ShieldCheck color="var(--color-success)" size={20} />;
      case 'PROPOSAL': return <Activity color="var(--color-accent-primary)" size={20} />;
      case 'ORCHESTRATOR': return <MessageSquare color="var(--color-warning)" size={20} />;
      default: return <Bot color="var(--color-text-tertiary)" size={20} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {logs.map((log) => {
        const hasTxHash = !!log.output?.txHash;

        return (
          <div key={log.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              {getIcon(log.agentType)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{log.agentType} AGENT: {log.action}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                
                {hasTxHash ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    Verified On-Chain ({log.output.txHash.substring(0,6)}...)
                  </span>
                ) : (
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                    onClick={() => handlePublish(log.id)}
                    disabled={publishingId === log.id}
                  >
                    {publishingId === log.id ? 'Publishing...' : 'Publish to X Layer'}
                  </button>
                )}
              </div>
              
              {log.output && !log.output.txHash && Object.keys(log.output).length > 0 && (
                <pre style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', overflowX: 'auto', color: 'var(--color-text-secondary)' }}>
                  {JSON.stringify(log.output, null, 2)}
                </pre>
              )}
            </div>
          </div>
        );
      })}

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-4)' }}>
          No agent activity recorded yet.
        </div>
      )}
    </div>
  );
}
