import {
  generateAccessToken,
  generateRefreshToken,
  validateUser,
} from "@/libs/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if ((await validateUser(username, password)) === null) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const refreshToken = await generateRefreshToken(username);
  const accessToken = await generateAccessToken(username);

  return NextResponse.json(
    {
      accessToken,
      refreshToken,
    },
    {
      headers: {
        "Set-Cookie": `Refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Strict;`,
      },
    }
  );
}
