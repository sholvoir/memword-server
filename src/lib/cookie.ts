import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { maxAge } from "./common.ts";
import { jwt } from "./jwt.ts";

export const setAuthCookie = async (c: Context, username: string) => {
   const token = await jwt.createToken(maxAge, { aud: username });
   setCookie(c, "auth", token, {
      maxAge,
      secure: true,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
   });
};

export const clearAuthCookie = (c: Context) =>
   deleteCookie(c, "auth", {
      path: "/",
      secure: true,
      httpOnly: true,
   });
