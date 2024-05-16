import HitomiAPI from "@/libs/hitomi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export const unstable_allowDynamic = ["/src/libs/hitomi/unsafe.ts"];

export async function GET(request: NextRequest) {
  return NextResponse.json(await HitomiAPI.getGG());
}
