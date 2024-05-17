import { createUser } from "@/libs/auth";
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

  const { accessToken, refreshToken } = await createUser({
    id,
    password,
  });

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
