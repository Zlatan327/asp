import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { scoutAgent } from '@/lib/ai';
import { parseCvFile } from '@/lib/cv/parse';
import { scanAndPersistSocialAccounts } from '@/lib/social/scan';

export const runtime = 'nodejs';

export const POST = auth(async (req: any) => {
  try {
    const session = req.auth;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', details: JSON.stringify(session) }, { status: 401 });
    }

    // req from auth() wrapper might need to use req.request or standard methods depending on NextAuth version
    // But req is still a standard Request object in the NextAuth wrapper.
    const formData = await req.formData();
    const role = formData.get('role') as 'FREELANCER' | 'CLIENT';
    const cvFile = formData.get('cv') as File | null;
    const companyName = formData.get('companyName') as string | null;

    // Update user role and onboarded status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role,
        onboardedAt: new Date(),
      },
    });

    if (role === 'FREELANCER') {
      const parsedCv = await parseCvFile(cvFile);

      // Fetch user's connected social accounts
      const socials = await prisma.socialAccount.findMany({
        where: { userId: session.user.id }
      });
      const socialScans = await scanAndPersistSocialAccounts(session.user.id);

      // Prepare raw data for Scout Agent
      const rawData = {
        cv: parsedCv,
        cvText: parsedCv?.text || '',
        socials: socials.map(s => ({
          platform: s.platform,
          handle: s.handle,
          url: s.profileUrl
        })),
        socialScans,
      };

      // Trigger the Scout Agent to generate the profile or use defaults if empty
      let scoutReport;
      if (!parsedCv?.parsed && socials.length === 0) {
        scoutReport = {
          skills: [],
          experiences: [],
          education: [],
          credibilityScore: 0,
          badges: [],
          narrative: "Started from scratch without uploading a CV or linking social accounts. Reputation is ready to be built from zero.",
          sources: {
            cv: parsedCv ? { parsed: false, sections: [] } : undefined,
          },
          generatedAt: new Date().toISOString(),
        };
      } else {
        scoutReport = await scoutAgent.analyzeProfile(rawData);
      }

      // Create or update the Freelancer Profile
      await prisma.freelancerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          skills: scoutReport.skills as any,
          experiences: scoutReport.experiences as any,
          education: scoutReport.education as any,
          credibilityScore: scoutReport.credibilityScore,
          badges: scoutReport.badges as any,
          scoutReport: scoutReport as any,
        },
        create: {
          userId: session.user.id,
          skills: scoutReport.skills as any,
          experiences: scoutReport.experiences as any,
          education: scoutReport.education as any,
          credibilityScore: scoutReport.credibilityScore,
          badges: scoutReport.badges as any,
          scoutReport: scoutReport as any,
        }
      });
      
      // Initialize or update reputation
      await prisma.reputation.upsert({
        where: { userId: session.user.id },
        update: {
          overallScore: scoutReport.credibilityScore,
          profileScore: scoutReport.credibilityScore,
          socialScore: socialScans.some(scan => scan.ok) ? Math.min(100, 50 + socialScans.filter(scan => scan.ok).length * 20) : 0,
          badges: scoutReport.badges as any,
        },
        create: {
          userId: session.user.id,
          overallScore: scoutReport.credibilityScore,
          profileScore: scoutReport.credibilityScore,
          socialScore: socialScans.some(scan => scan.ok) ? Math.min(100, 50 + socialScans.filter(scan => scan.ok).length * 20) : 0,
          badges: scoutReport.badges as any,
        }
      });
    } else {
      // Create Client Profile
      await prisma.clientProfile.upsert({
        where: { userId: session.user.id },
        update: {
          companyName: companyName || null,
        },
        create: {
          userId: session.user.id,
          companyName: companyName || null,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});
