import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  FileVideo,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';

const readinessItems = [
  'Clear ASP category: Software Utility for freelancer operations',
  'Single user promise: turn a messy freelance brief into matched talent, tasks, escrow, and reputation',
  'Live production deployment with health endpoint',
  'Demo path works without explaining internal implementation details',
  'X Layer escrow and wallet flows are visible in-product',
  'Submission assets are short enough for a 90 second walkthrough',
];

const demoSteps = [
  {
    title: 'Client posts a gig',
    detail:
      'A client turns a project idea into a scoped gig with budget, skills, duration, and acceptance criteria.',
  },
  {
    title: 'Agents prepare the work graph',
    detail:
      'The platform generates freelancer fit, proposal language, and a task board so both parties can start from a shared plan.',
  },
  {
    title: 'Escrow protects the handoff',
    detail:
      'Client funding is routed through X Layer escrow before work begins, reducing counterparty risk for both sides.',
  },
  {
    title: 'Completion becomes reputation',
    detail:
      'Approved work can update the freelancer profile and mint or refresh a reputation SBT for portable trust.',
  },
];

const xPost = `Built KLOP for the #OKXAI Genesis Hackathon.

KLOP is an Agent Service Provider for freelance work: AI scopes gigs, generates proposals/tasks, and uses X Layer escrow plus reputation SBTs so clients and indie builders can work with less trust friction.

Demo: [production URL]`;

export default function OKXAISubmissionPage() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0 var(--space-20)' }}>
      <section className="container" style={{ display: 'grid', gap: 'var(--space-10)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="badge badge-primary" style={{ marginBottom: 'var(--space-5)' }}>
              <Sparkles size={14} />
              OKX.AI Genesis Submission
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 4.75rem)',
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: '0',
                marginBottom: 'var(--space-6)',
              }}
            >
              KLOP is an ASP for trust-minimized freelance work.
            </h1>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-xl)',
                lineHeight: 1.65,
                maxWidth: 760,
                marginBottom: 'var(--space-8)',
              }}
            >
              It helps clients and indie builders move from an unstructured brief to a scoped gig,
              AI-generated work plan, X Layer escrow, and portable reputation without forcing either
              side to coordinate through slow marketplace meta-work.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Link href="/login" className="btn btn-primary btn-lg">
                Open Demo
                <ExternalLink size={18} />
              </Link>
              <Link href="/marketplace" className="btn btn-secondary btn-lg">
                View Marketplace
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <SignalRow icon={<Bot size={20} />} label="ASP category" value="Software Utility" />
              <SignalRow icon={<WalletCards size={20} />} label="Settlement rail" value="X Layer escrow" />
              <SignalRow icon={<ShieldCheck size={20} />} label="Trust primitive" value="Reputation SBT" />
              <SignalRow icon={<CircleDollarSign size={20} />} label="Revenue path" value="Per-gig service fee" />
            </div>
          </div>
        </div>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {demoSteps.map((step, index) => (
            <article key={step.title} className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 42, 42, 0.12)',
                  color: 'var(--color-accent-primary)',
                  fontWeight: 800,
                  marginBottom: 'var(--space-4)',
                }}
              >
                {index + 1}
              </div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                {step.title}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{step.detail}</p>
            </article>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <ClipboardCheck color="var(--color-success)" />
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 850 }}>Listing Readiness</h2>
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {readinessItems.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-success)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <FileVideo color="var(--color-accent-primary)" />
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 850 }}>90 Second Demo Script</h2>
            </div>
            <ol style={{ display: 'grid', gap: 'var(--space-3)', paddingLeft: '1.2rem', color: 'var(--color-text-secondary)' }}>
              <li>Open with the problem: freelance marketplaces waste time and trust.</li>
              <li>Show posting or browsing a gig, then the AI-assisted workflow.</li>
              <li>Open the workspace task board and explain agent-generated milestones.</li>
              <li>Show the escrow panel and X Layer payment/reputation loop.</li>
              <li>Close on OKX.AI value: a monetizable ASP for real-world work.</li>
            </ol>
          </div>
        </section>

        <section className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 850, marginBottom: 'var(--space-4)' }}>
            X Post Draft
          </h2>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              background: 'rgba(0,0,0,0.22)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              lineHeight: 1.65,
              overflowX: 'auto',
            }}
          >
            {xPost}
          </pre>
        </section>
      </section>
    </div>
  );
}

function SignalRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,0.025)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-accent-primary)' }}>
        {icon}
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{label}</span>
      </div>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}
