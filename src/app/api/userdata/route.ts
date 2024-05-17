import { validate } from "@/libs/auth/tools";
import { getUserdata, setUserdata, UserData } from "@/libs/db/userdata";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { userid, error, status } = await validate(request);

  if (!userid) {
    return NextResponse.json({ error }, { status });
  }

  let userdata = (await getUserdata(userid))?.data;

  if (!userdata) {
    userdata = { favorites: [] };
    await setUserdata(userid, userdata);
  }

  return NextResponse.json(userdata);
}

export async function POST(request: NextRequest) {
  const { userid, error, status } = await validate(request);

  if (!userid) {
    console.log(error, status);
    return NextResponse.json({ error }, { status });
  }

  const userdata: UserData = await request.json();

  await setUserdata(userid, userdata);

  return NextResponse.json(userdata);
}
