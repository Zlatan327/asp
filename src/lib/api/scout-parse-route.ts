import { NextResponse } from 'next/server';
import { scoutAgent } from '@/lib/ai';
import { parseCvFile } from '@/lib/cv/parse';

type ScoutParseInput = {
  cvText?: string;
  profile?: Record<string, unknown>;
  socials?: unknown[];
  socialScans?: unknown[];
};

function parseJsonField(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function readInput(req: Request): Promise<ScoutParseInput & { cvFile?: File | null }> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const cvFile = formData.get('cv');

    return {
      cvFile: cvFile instanceof File ? cvFile : null,
      cvText: typeof formData.get('cvText') === 'string' ? String(formData.get('cvText')) : undefined,
      profile: parseJsonField(formData.get('profile')) as Record<string, unknown> | undefined,
      socials: parseJsonField(formData.get('socials')) as unknown[] | undefined,
      socialScans: parseJsonField(formData.get('socialScans')) as unknown[] | undefined,
    };
  }

  if (contentType.includes('application/json')) {
    return (await req.json()) as ScoutParseInput;
  }

  const text = await req.text();
  return text.trim() ? { cvText: text } : {};
}

export async function GET() {
  return NextResponse.json({
    service: 'SkillMint Scout Parse',
    status: 'ready',
    methods: ['POST'],
    accepts: ['application/json', 'multipart/form-data', 'text/plain'],
    example: {
      cvText: 'Frontend engineer with React, Next.js, TypeScript and Solidity experience.',
      socials: [{ platform: 'GITHUB', handle: 'example' }],
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const input = await readInput(req);
    const parsedCv = await parseCvFile(input.cvFile || null);
    const cvText = input.cvText || parsedCv?.text || '';

    const scoutReport = await scoutAgent.analyzeProfile({
      cv: parsedCv,
      cvText,
      profile: input.profile || {},
      socials: Array.isArray(input.socials) ? input.socials : [],
      socialScans: Array.isArray(input.socialScans) ? input.socialScans : [],
    });

    return NextResponse.json(
      {
        success: true,
        service: 'SkillMint Scout Parse',
        data: scoutReport,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'scout_parse_failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
