export default function FeaturesSection() {
  const features = [
    {
      title: "AI Proposal Generator",
      description: "Our ProposalAgent drafts highly personalized, persuasive pitches based on your skillset, saving you hours of writing.",
      icon: "🤖",
      color: "var(--color-accent-primary)"
    },
    {
      title: "Task Orchestrator",
      description: "Once hired, the TaskManagerAgent automatically breaks down the project into a Kanban board of actionable milestones.",
      icon: "🧠",
      color: "var(--color-accent-secondary)"
    },
    {
      title: "X Layer Smart Escrow",
      description: "Funds are locked in a decentralized smart contract on the X Layer. Get paid instantly when the client approves the work.",
      icon: "⛓️",
      color: "var(--color-success)"
    },
    {
      title: "Soulbound Reputation",
      description: "Your performance is immortalized on-chain. Build a verifiable Web3 resume that clients can trust globally.",
      icon: "🛡️",
      color: "var(--color-warning)"
    }
  ];

  return (
    <section className="section relative">
      <div className="container">
        <div className="text-center" style={{ marginBottom: 'var(--space-12)' }}>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-4)' }}>Supercharged by AI & Web3</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto' }}>
            We've removed the friction from freelancing. No more chasing payments, writing endless cover letters, or dealing with untrustworthy clients.
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {features.map((feature, i) => (
            <div key={i} className="glass-card card-interactive" style={{ padding: 'var(--space-8)' }}>
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: 'var(--space-4)', 
                width: 60, height: 60, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `color-mix(in srgb, \${feature.color} 15%, transparent)`,
                borderRadius: 'var(--radius-md)',
                border: `1px solid color-mix(in srgb, \${feature.color} 30%, transparent)`
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
