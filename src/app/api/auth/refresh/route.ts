import { generateAccessToken, verifyRefreshToken } from "@/libs/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const cookies = request.cookies;

  const refreshToken = cookies.get("Refresh")?.value;

  if (!refreshToken) {
    return new NextResponse("No token provided", { status: 401 });
  }

  const userid = await verifyRefreshToken(refreshToken);

  if (!userid) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const token = await generateAccessToken(userid);

  return new NextResponse(token);
}

export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json();

  if (!refreshToken) {
    return new NextResponse("No token provided", { status: 401 });
  }

  const userid = await verifyRefreshToken(refreshToken);

  if (!userid) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const token = await generateAccessToken(userid);

  return new NextResponse(token);
}
