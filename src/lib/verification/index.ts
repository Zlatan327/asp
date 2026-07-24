export interface IVerificationProvider {
  /**
   * Verifies the provided proof against a target URL/account.
   * Returns a boolean indicating success or failure.
   */
  verify(proofData: string, targetUrl: string): Promise<boolean>;
}

export class ZkPassProvider implements IVerificationProvider {
  constructor(private readonly verifyUrl: string, private readonly apiKey?: string) {}

  async verify(proofData: string, targetUrl: string): Promise<boolean> {
    const response = await fetch(this.verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ proofData, targetUrl }),
    });

    if (!response.ok) {
      throw new Error(`Verifier rejected proof (${response.status})`);
    }

    const result = await response.json();
    return result.valid === true || result.success === true;
  }
}

export class MockZKProvider implements IVerificationProvider {
  async verify(proofData: string, targetUrl: string): Promise<boolean> {
    // In a real implementation, this would verify a zkPass or TLSNotary proof
    // For the hackathon MVP, we simulate a delay and randomly succeed based on the proof payload
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const parsed = JSON.parse(proofData);
          if (parsed.mockSuccess) {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      }, 1500); // Simulate network/computation delay
    });
  }
}

export function getVerificationProvider(): { provider: IVerificationProvider; mode: 'real' | 'mock' } {
  if (process.env.ZKPASS_VERIFY_URL) {
    return {
      provider: new ZkPassProvider(process.env.ZKPASS_VERIFY_URL, process.env.ZKPASS_API_KEY),
      mode: 'real',
    };
  }

  if (process.env.ENABLE_MOCK_ZK === 'true' || process.env.NODE_ENV !== 'production') {
    return {
      provider: new MockZKProvider(),
      mode: 'mock',
    };
  }

  throw new Error('No real ZK verifier configured. Set ZKPASS_VERIFY_URL or ENABLE_MOCK_ZK=true for demo mode.');
}
