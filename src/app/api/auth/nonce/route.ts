import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { cookies } from 'next/headers';

export async function GET() {
  const nonce = generateNonce();
  
  // Set the nonce in a secure httpOnly cookie to verify it later in the Credentials provider
  const cookieStore = await cookies();
  cookieStore.set('siwe_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return NextResponse.json({ nonce }, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}
