import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db, UserTable } from "../db";

bcrypt.setRandomFallback((len) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)))
);

export async function generateAccessToken(userid: string) {
  return await new SignJWT({ userid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET!));
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET!)
    );

    return payload.userid as string;
  } catch {
    return null;
  }
}

export async function generateRefreshToken(userid: string) {
  const token = await new SignJWT({ userid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!));

  await db
    .updateTable("users")
    .set({ refreshToken: token })
    .where("id", "=", userid)
    .execute();

  return token;
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!)
    );

    const query = await db
      .selectFrom("users")
      .select(["id"])
      .where("id", "=", payload.userid as string)
      .where("refreshToken", "=", token)
      .executeTakeFirst();

    if (!query) {
      return null;
    }

    return query.id;
  } catch {
    return null;
  }
}

export async function removeRefreshToken(userid: string) {
  await db
    .updateTable("users")
    .set({ refreshToken: undefined })
    .where("id", "=", userid)
    .execute();
}

export async function validateUser(userid: string, password: string) {
  const query = await db
    .selectFrom("users")
    .select(["id", "password"])
    .where("id", "=", userid)
    .executeTakeFirst();

  if (!query) {
    return null;
  }

  const { id, password: hash } = query;

  if (bcrypt.compareSync(password, hash)) {
    return id;
  } else {
    return null;
  }
}

export async function createUser(
  user: Pick<UserTable, "id" | "password"> &
    Partial<Omit<UserTable, "refreshToken">>
) {
  const hash = bcrypt.hashSync(user.password, 10);

  const refreshToken = await generateRefreshToken(user.id);
  const accessToken = await generateAccessToken(user.id);

  await db
    .insertInto("users")
    .values({
      ...user,
      password: hash,
      refreshToken,
    })
    .execute();

  return { id: user.id, accessToken, refreshToken };
}
