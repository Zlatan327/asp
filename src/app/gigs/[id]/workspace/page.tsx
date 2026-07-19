'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EscrowPanel from '@/components/EscrowPanel';
import type { GigTask, TaskStatus } from '@/types';

type WorkspaceGig = {
  id: string;
  clientId: string;
  freelancerId: string | null;
  title: string;
  budget: number;
  status: string;
  escrowContractAddress: string | null;
  freelancer?: {
    id: string;
    walletAddress?: string | null;
  } | null;
};

export default function GigWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  
  const [gig, setGig] = useState<WorkspaceGig | null>(null);
  const [tasks, setTasks] = useState<GigTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const gigRes = await fetch(`/api/gigs/${unwrappedParams.id}`);
      const gigData = await gigRes.json();
      setGig(gigData);

      const tasksRes = await fetch(`/api/gigs/${unwrappedParams.id}/tasks`);
      const tasksData = await tasksRes.json();
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      alert('Failed to load workspace data.');
    } finally {
      setLoading(false);
    }
  }, [unwrappedParams.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/gigs/${unwrappedParams.id}/tasks/generate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to generate tasks');
      const newTasks = await res.json() as GigTask[];
      setTasks(prev => [...prev, ...newTasks]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      const res = await fetch(`/api/gigs/${unwrappedParams.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
      fetchData(); // revert
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading Workspace...</div>;
  if (!gig) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Gig not found.</div>;

  const isClient = session?.user?.id === gig.clientId;
  const isFreelancer = session?.user?.id === gig.freelancerId;

  if (!isClient && !isFreelancer) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Unauthorized.</div>;
  }

  // Security measure: Block freelancer until client funds escrow
  if (gig.status === 'PENDING_FUNDS' && isFreelancer) {
    return (
      <div style={{ padding: 'var(--space-8)', maxWidth: 600, margin: '100px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Waiting for Escrow</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
            The client has accepted your proposal, but the funds have not been deposited into the smart contract yet. To protect your work, this workspace will remain locked until the escrow is fully funded.
          </p>
          <button className="btn btn-secondary" onClick={() => router.push(`/gigs/${gig.id}`)}>
            Back to Gig Details
          </button>
        </div>
      </div>
    );
  }

  const columns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Workspace: {gig.title}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              Manage tasks, deliverables, and escrow.
            </p>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={() => router.push(`/gigs/${gig.id}`)}>
              Back to Details
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-8)' }}>
          
          {/* Kanban Board */}
          <div className="glass-card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
            <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-accent-primary)', background: 'rgba(56, 189, 248, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent-primary)', boxShadow: '0 0 10px var(--color-accent-primary)' }}></div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-accent-primary)' }}>🤖 Task Manager Agent Active</h3>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                Monitoring deliverables and escrow status. The agent automatically verifies work and releases milestone payments when tasks reach the <strong>DONE</strong> column.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Task Board</h2>
              {tasks.length === 0 && (
                <button className="btn btn-primary" onClick={handleGenerateTasks} disabled={generating}>
                  {generating ? '✨ Agent Generating Tasks...' : '✨ Auto-Generate Tasks with AI'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)', minWidth: 800 }}>
              {columns.map(col => (
                <div key={col} style={{ flex: 1, minHeight: 400, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
                    {col.replace('_', ' ')}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {tasks.filter(t => t.status === col).map(task => (
                      <div key={task.id} className="card" style={{ padding: 'var(--space-3)', cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)' }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>{task.description}</div>}
                        
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                          {col !== 'TODO' && (
                            <button className="btn" style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', flex: 1 }} onClick={() => handleUpdateTaskStatus(task.id, columns[columns.indexOf(col) - 1])}>
                              ← Move
                            </button>
                          )}
                          {col !== 'DONE' && (
                            <button className="btn" style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', flex: 1 }} onClick={() => handleUpdateTaskStatus(task.id, columns[columns.indexOf(col) + 1])}>
                              Move →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <EscrowPanel 
              gig={gig} 
              isClient={isClient} 
              onEscrowCreated={() => fetchData()} 
            />
            
            {gig.status === 'DONE' && (
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>Project Complete 🎉</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>The funds have been released and the project is finished.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
