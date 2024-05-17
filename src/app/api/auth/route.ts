import { verifyAccessToken } from "@/libs/auth";
import { getUser } from "@/libs/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const headers = request.headers;

  const token = headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  const userid = await verifyAccessToken(token);

  if (!userid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await getUser(userid);

  return NextResponse.json(user);
}
