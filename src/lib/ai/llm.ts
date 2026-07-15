/**
 * LLM Client — Unified wrapper supporting OpenAI-compatible APIs
 * Supports: OpenAI, Xiaomi Mimo, and any OpenAI-compatible endpoint
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function getConfig() {
  const provider = process.env.LLM_PROVIDER || 'openai';

  if (provider === 'mimo') {
    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) throw new Error('MIMO_API_KEY is not set. Please configure it in your .env file.');
    return {
      apiKey,
      baseUrl: process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1',
      model: process.env.MIMO_MODEL || 'mimo-v2.5-pro',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set. Please configure it in your .env file.');
  return {
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  };
}

/**
 * Send a chat completion request to the configured LLM provider
 */
export async function chatCompletion(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  // --- HACKATHON DEMO MOCK ---
  const isMocked = true;
  if (isMocked) {
    await new Promise(r => setTimeout(r, 1500));
    
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    
    if (systemPrompt.includes('ASP Proposal Agent')) {
      const mockJson = {
        coverLetter: "Hi there! I am a highly skilled Web3 developer with extensive experience in Next.js and the X Layer ecosystem. I have reviewed the requirements for this gig and I am extremely confident I can deliver high-quality results ahead of your deadline. My Auto-Bot agent has verified that my GitHub repository history perfectly aligns with your required skills.\n\nI am ready to begin immediately and will utilize the X Layer USDT Escrow to guarantee trust. Looking forward to working with you!",
        suggestedBid: 150,
        confidence: 98,
        keyPoints: ["Next.js Expert", "X Layer Experience", "Solidity Smart Contracts"],
        referencedWork: ["github.com/my-repo/web3-dapp"]
      };
      return { content: JSON.stringify(mockJson), model: 'mock-mimo' };
    }
    
    return { content: JSON.stringify({ success: true, message: "Mocked AI Response" }), model: 'mock-mimo' };
  }
  // -----------------------------

  const config = getConfig();
  const model = options.model || config.model;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice?.message?.content) {
    throw new Error('No content in LLM response');
  }

  return {
    content: choice.message.content,
    model: data.model || model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Parse a JSON response from the LLM, handling markdown code blocks
 */
export function parseLLMJson<T>(content: string): T {
  // Strip markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Convenience: Single prompt → response
 */
export async function ask(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const result = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options
  );
  return result.content;
}

/**
 * Convenience: Single prompt → parsed JSON response
 */
export async function askJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<T> {
  const content = await ask(
    systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no explanation.',
    userPrompt,
    options
  );
  return parseLLMJson<T>(content);
}
