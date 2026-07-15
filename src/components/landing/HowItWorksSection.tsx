export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Client Posts a Gig",
      desc: "Describe the project. Our ScoutAgent analyzes the requirements and tags the best freelancers."
    },
    {
      num: "02",
      title: "AI Drafts Proposals",
      desc: "Freelancers review gigs and click 'Generate Proposal'. AI crafts a tailored pitch instantly."
    },
    {
      num: "03",
      title: "Smart Escrow Funding",
      desc: "Client hires the freelancer and locks the project funds in a secure X Layer smart contract."
    },
    {
      num: "04",
      title: "Agent Orchestration",
      desc: "TaskManagerAgent breaks the gig into a Kanban board. The freelancer uploads deliverables for review."
    },
    {
      num: "05",
      title: "Payment & Reputation",
      desc: "Client approves work. Funds are released instantly, and the freelancer earns an On-Chain SBT badge."
    }
  ];

  return (
    <section id="how-it-works" className="section bg-bg-tertiary" style={{ background: 'var(--color-bg-tertiary)' }}>
      <div className="container">
        <h2 className="text-center" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-12)' }}>How KLOP Works</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 800, margin: '0 auto' }}>
          {steps.map((step, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
              <div style={{ 
                fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'transparent',
                WebkitTextStroke: '1px var(--color-border-strong)'
              }}>
                {step.num}
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{step.title}</h4>
                <p style={{ color: 'var(--color-text-secondary)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
