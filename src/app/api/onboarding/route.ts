import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { scoutAgent } from '@/lib/ai';

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
      let extractedText = '';

      if (cvFile) {
        // In a real implementation, we would parse the PDF/DOCX using pdf-parse or mammoth
        // For now, we simulate extraction.
        extractedText = `Uploaded CV: ${cvFile.name}. Extracted simulated text.`;
      }

      // Fetch user's connected social accounts
      const socials = await prisma.socialAccount.findMany({
        where: { userId: session.user.id }
      });

      // Prepare raw data for Scout Agent
      const rawData = {
        cvText: extractedText,
        socials: socials.map(s => ({
          platform: s.platform,
          handle: s.handle,
          url: s.profileUrl
        }))
      };

      // Trigger the Scout Agent to generate the profile or use defaults if empty
      let scoutReport;
      if (!cvFile && socials.length === 0) {
        scoutReport = {
          skills: [],
          experiences: [],
          education: [],
          credibilityScore: 0,
          badges: [],
          narrative: "Started from scratch without uploading a CV or linking social accounts. Reputation is ready to be built from zero."
        };
      } else {
        scoutReport = await scoutAgent.analyzeProfile(rawData);
      }

      // Create or update the Freelancer Profile
      await prisma.freelancerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          skills: JSON.stringify(scoutReport.skills),
          experiences: JSON.stringify(scoutReport.experiences),
          education: JSON.stringify(scoutReport.education),
          credibilityScore: scoutReport.credibilityScore,
          badges: JSON.stringify(scoutReport.badges),
          scoutReport: JSON.stringify(scoutReport),
        },
        create: {
          userId: session.user.id,
          skills: JSON.stringify(scoutReport.skills),
          experiences: JSON.stringify(scoutReport.experiences),
          education: JSON.stringify(scoutReport.education),
          credibilityScore: scoutReport.credibilityScore,
          badges: JSON.stringify(scoutReport.badges),
          scoutReport: JSON.stringify(scoutReport),
        }
      });
      
      // Initialize or update reputation
      await prisma.reputation.upsert({
        where: { userId: session.user.id },
        update: {
          overallScore: scoutReport.credibilityScore,
          profileScore: scoutReport.credibilityScore,
          badges: JSON.stringify(scoutReport.badges),
        },
        create: {
          userId: session.user.id,
          overallScore: scoutReport.credibilityScore,
          profileScore: scoutReport.credibilityScore,
          badges: JSON.stringify(scoutReport.badges),
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
