'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Bot, UploadCloud, Building2, UserCircle2, Loader2, Link as LinkIcon, Award } from 'lucide-react';
import { EscrowService } from '@/lib/blockchain/contracts';

export default function OnboardingFlow() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'FREELANCER' | 'CLIENT' | null>(null);
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [agentMessage, setAgentMessage] = useState('Initializing Scout Agent...');
  const [scoutReport, setScoutReport] = useState<any>(null);
  const [mintingSbt, setMintingSbt] = useState(false);
  const [sbtMinted, setSbtMinted] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep(3); // Move to Processing step
    setLoading(true);

    try {
      setAgentMessage('Parsing your profile data...');
      const formData = new FormData();
      formData.append('role', role || 'FREELANCER');
      if (cvFile) formData.append('cv', cvFile);
      if (companyName) formData.append('companyName', companyName);

      // Simulate a slightly longer agent thinking time for UX
      await new Promise(r => setTimeout(r, 1500));
      setAgentMessage('Scout Agent is generating your verified profile...');

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: ' + (data.details || ''));
        }
        throw new Error(data.error || data.details || 'Onboarding failed');
      }

      setAgentMessage('Profile generated successfully!');
      if (role === 'FREELANCER' && data.scoutReport) {
        setScoutReport(data.scoutReport);
        setStep(4);
      } else {
        await new Promise(r => setTimeout(r, 1000));
        router.push('/agent-dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Unauthorized') {
        alert('Your session has expired or is invalid (e.g. database was reset). Please log in again.');
        window.location.href = '/login';
        return;
      }
      alert('Failed to save profile: ' + (err.message || String(err)));
      setStep(2); // Go back to fix errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div className="glass-card" style={{ maxWidth: 600, width: '100%', padding: 'var(--space-8)' }}>
        
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                Welcome to SkillMint
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                How do you want to use the platform?
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <div
                onClick={() => setRole('FREELANCER')}
                className={`card card-interactive ${role === 'FREELANCER' ? 'bg-primary' : ''}`}
                style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: role === 'FREELANCER' ? '2px solid var(--color-accent-primary)' : '2px solid transparent' }}
              >
                <UserCircle2 size={40} style={{ margin: '0 auto var(--space-4)', color: role === 'FREELANCER' ? 'var(--color-accent-primary)' : 'inherit' }} />
                <div style={{ fontWeight: 600 }}>Work as Freelancer</div>
              </div>
              <div
                onClick={() => setRole('CLIENT')}
                className={`card card-interactive ${role === 'CLIENT' ? 'bg-primary' : ''}`}
                style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: role === 'CLIENT' ? '2px solid var(--color-accent-primary)' : '2px solid transparent' }}
              >
                <Building2 size={40} style={{ margin: '0 auto var(--space-4)', color: role === 'CLIENT' ? 'var(--color-accent-primary)' : 'inherit' }} />
                <div style={{ fontWeight: 600 }}>Hire Talent</div>
              </div>
            </div>

            <button
              disabled={!role}
              onClick={() => {
                if (role) {
                  persistOnboardingState(role, '2');
                }
                setStep(2);
              }}
              className="btn btn-primary btn-lg w-full"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Profile Details */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                {role === 'FREELANCER' ? 'Build Your Footprint' : 'Company Details'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                {role === 'FREELANCER' ? 'Let the Scout Agent generate your verified profile.' : 'Tell us about your organization.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {role === 'FREELANCER' && (
                <>
                  <div className="alert alert-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Bot size={20} />
                      <strong>Agent Assist:</strong>
                    </div>
                    <span style={{ display: 'block', marginTop: 'var(--space-1)' }}>Upload your CV or link your socials. The Scout Agent will automatically extract your skills and generate your profile.</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Upload CV (PDF/Word)</label>
                    <div className="card" style={{ padding: 'var(--space-4)', borderStyle: 'dashed', textAlign: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        id="cv-upload"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="cv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <UploadCloud size={32} color="var(--color-text-tertiary)" />
                        <span style={{ color: cvFile ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                          {cvFile ? cvFile.name : 'Click to upload your CV'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Social Connections</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {socialProviders.map((provider) => {
                        const connected = connectedByPlatform.get(provider.platform);
                        const isConnected = Boolean(connected);
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            className="btn btn-secondary"
                            disabled={isConnected || socialsLoading}
                            style={{
                              flex: 1,
                              display: 'flex',
                              gap: 'var(--space-2)',
                              justifyContent: 'center',
                              opacity: isConnected ? 0.55 : 1,
                              cursor: isConnected ? 'not-allowed' : 'pointer',
                              background: isConnected ? 'rgba(255,255,255,0.05)' : undefined,
                              borderColor: isConnected ? 'var(--color-border-subtle)' : undefined,
                            }}
                            onClick={() => {
                              if (!isConnected) {
                                const selectedRole = role || 'FREELANCER';
                                persistOnboardingState(selectedRole, '2');
                                signIn(provider.id, {
                                  callbackUrl: `/onboarding?step=footprint&role=${selectedRole}`,
                                });
                              }
                            }}
                          >
                            {isConnected ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
                            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, alignItems: 'center' }}>
                              <span>{isConnected ? 'Connected' : provider.label}</span>
                              {isConnected && (
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                  @{connected?.handle || provider.label}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="alert alert-warning" style={{ marginTop: 'var(--space-2)' }}>
                    <strong>🌱 New to Freelancing?</strong> You can skip uploads and start from scratch. Your reputation will grow as you complete gigs.
                  </div>
                </>
              )}

              {role === 'CLIENT' && (
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    className="input"
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    window.sessionStorage.removeItem(ONBOARDING_STEP_KEY);
                    window.localStorage.removeItem(ONBOARDING_STEP_KEY);
                    setStep(1);
                  }}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }}>
                  Generate Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Agent Processing */}
        {step === 3 && (
          <div className="animate-fade-in-up" style={{ textAlign: 'center', padding: 'var(--space-10) 0' }}>
            <Loader2 size={64} className="spin" style={{ margin: '0 auto var(--space-6)', color: 'var(--color-accent-primary)' }} />
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
              Agent at Work
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)' }}>
              {agentMessage}
            </p>
          </div>
        )}

        {/* Step 4: Verification Result */}
        {step === 4 && scoutReport && (
          <div className="animate-fade-in-up">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                Verified Profile Ready
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Scout Agent has extracted and verified your capabilities.
              </p>
            </div>
            
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Credibility Score</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                  {scoutReport.credibilityScore} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>/ 100</span>
                </div>
              </div>
              
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Verified Skills</div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {scoutReport.skills?.map((skill: any) => (
                    <span key={skill.name} className="skill-tag">
                      {skill.name} <span style={{ opacity: 0.6, fontSize: '0.8em' }}>{skill.confidence}%</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Key Strengths</div>
                <ul style={{ paddingLeft: 'var(--space-4)', margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                  {scoutReport.strengths?.map((s: string, i: number) => (
                    <li key={i} style={{ marginBottom: 'var(--space-1)' }}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {!sbtMinted ? (
              <button
                disabled={mintingSbt}
                onClick={async () => {
                  setMintingSbt(true);
                  try {
                    // For the demo, we assume the user's wallet is connected or will prompt.
                    // Pass a dummy IPFS hash or metadata string as the token URI
                    const mockTokenUri = `ipfs://QmProfile${session?.user?.id}`;
                    
                    // We need the user's address. If wallet provider prompts them, getProvider handles it.
                    // But we actually need to pass the user's address to mintReputationSBT. 
                    // Let's get it from the signer inside the function.
                    // Wait, EscrowService.mintReputationSBT takes (userAddress, tokenURI)
                    const { getProvider } = await import('@/lib/blockchain/contracts');
                    const provider = await getProvider();
                    const signer = await provider.getSigner();
                    await EscrowService.mintReputationSBT(signer.address, mockTokenUri);
                    
                    setSbtMinted(true);
                    alert('Successfully Minted your Reputation SBT to X Layer!');
                  } catch (err: any) {
                    alert('Failed to mint SBT: ' + err.message);
                  } finally {
                    setMintingSbt(false);
                  }
                }}
                className="btn btn-primary btn-lg w-full"
                style={{ marginBottom: 'var(--space-4)', background: 'linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary))' }}
              >
                {mintingSbt ? 'Minting on X Layer...' : <><Award size={20} /> Mint Profile SBT On-Chain</>}
              </button>
            ) : (
              <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                <strong>Verified On-Chain!</strong> Your SBT is securely minted.
              </div>
            )}

            <button
              onClick={() => router.push('/agent-dashboard')}
              className={`btn btn-${sbtMinted ? 'primary' : 'secondary'} btn-lg w-full`}
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
