// import { setCookie, getCookies, deleteCookie } from "@std/http";
import { JWT } from "@sholvoir/generic/jwt";

export const jwt = new JWT({ iss: 'micit.co', sub: 'memword' });
await jwt.importKey(Deno.env.get('APP_KEY'));

// const maxAge = 180 * 24 * 60 * 60;
// export const setAuth = async (resp: Response, aud?: string) => {
//     if (aud) setCookie(resp.headers, {
//         name: 'auth',
//         value: await jwt.createToken(maxAge, { aud }),
//         maxAge
//     });
//     else deleteCookie(resp.headers, 'auth');
//     return resp;
// }

// export const getToken = (req: Request) =>
//     new URL(req.url).searchParams.get('auth') ||
//     getCookies(req.headers).auth ||
//     req.headers.get('Authorization')?.match(/Bearer (.*)/)?.at(1);
