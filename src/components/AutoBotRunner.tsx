'use client';

import { useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';

export default function AutoBotRunner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const runAutoBot = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/autobot/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auto-Bot failed');

      const count = data.submitted?.length || 0;
      setResult(count ? `Submitted ${count} matched proposal${count === 1 ? '' : 's'}.` : 'No strong gig matches found right now.');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Auto-Bot failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={runAutoBot} disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
        {loading ? 'Scanning gigs...' : 'Run Auto-Bot'}
      </button>
      {result && (
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
          {result}
        </p>
      )}
    </div>
  );
}
