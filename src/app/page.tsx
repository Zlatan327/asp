import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      
      {/* Footer CTA */}
      <section className="section text-center relative overflow-hidden">
        <div className="bg-orb bg-orb-green" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 800 }}></div>
        <div className="container relative z-10">
          <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, marginBottom: 'var(--space-6)' }}>Ready to experience Web3 Freelancing?</h2>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
            <Link href="/onboarding?role=FREELANCER" className="btn btn-primary btn-lg">
              Start Earning
            </Link>
            <Link href="/marketplace" className="btn btn-secondary btn-lg">
              Explore Gigs
            </Link>
          </div>
        </div>
      </section>
      
      <footer style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-8) 0', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
        <p>Built for the OKX AI Genesis Hackathon 2026</p>
      </footer>
    </div>
  );
}
