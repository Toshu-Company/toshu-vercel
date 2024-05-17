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

  const { id, password } = body;

  if (!id || !password) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if ((await validateUser(id, password)) === null) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const refreshToken = await generateRefreshToken(id);
  const accessToken = await generateAccessToken(id);

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
