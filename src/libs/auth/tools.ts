import { NextRequest } from "next/server";
import { verifyAccessToken } from ".";

export async function validate(request: NextRequest) {
  const headers = request.headers;

  const token = headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return { error: "No token provided", status: 401 };
  }

  const userid = await verifyAccessToken(token);

  if (!userid) {
    return { error: "Invalid token", status: 401 };
  }

  return { userid };
}
