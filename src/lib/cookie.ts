import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { maxAge } from "./common.ts";
import { jwt } from "./jwt.ts";

export const setAuthCookie = async (c: Context, username: string) => {
   const token = await jwt.createToken(maxAge, { aud: username });
   setCookie(c, "auth", token, {
      maxAge,
      secure: true,
      httpOnly: true,
      sameSite: "Lax",
   });
};
