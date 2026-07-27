import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      agent: "SkillMint Agent Service Provider",
      service: "SkillMint",
      endpoints: {
        scoutParse: "/api/v1/scout/parse",
        publicScoutParse: "/v1/scout/parse",
      },
    },
    { status: 200 }
  );
}
