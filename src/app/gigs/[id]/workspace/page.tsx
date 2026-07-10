'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EscrowPanel from '@/components/EscrowPanel';

export default function GigWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  
  const [gig, setGig] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [unwrappedParams.id]);

  const fetchData = async () => {
    try {
      const gigRes = await fetch(`/api/gigs/\${unwrappedParams.id}`);
      const gigData = await gigRes.json();
      setGig(gigData);

      const tasksRes = await fetch(`/api/gigs/\${unwrappedParams.id}/tasks`);
      const tasksData = await tasksRes.json();
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/gigs/\${unwrappedParams.id}/tasks/generate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to generate tasks');
      const newTasks = await res.json();
      setTasks(prev => [...prev, ...newTasks]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      const res = await fetch(`/api/gigs/\${unwrappedParams.id}/tasks/\${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err: any) {
      alert(err.message);
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

  const columns = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

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
            <button className="btn btn-secondary" onClick={() => router.push(`/gigs/\${gig.id}`)}>
              Back to Details
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-8)' }}>
          
          {/* Kanban Board */}
          <div className="glass-card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
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
