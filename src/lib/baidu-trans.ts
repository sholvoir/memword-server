import { getJson, url } from "@sholvoir/generic/http";
import { crypto } from "@std/crypto/crypto";

const appid = Deno.env.get("BAIDU_APPID");
const key = Deno.env.get("BAIDU_SECRET");
const baseUrl = "https://fanyi-api.baidu.com/api/trans/vip/translate";
const from = "en";
const to = "zh";

const translate = async (q: string): Promise<string | null> => {
   const salt = Date.now().toString();
   const str1 = appid + q + salt + key;
   const sign = new Uint8Array(
      await crypto.subtle.digest("MD5", new TextEncoder().encode(str1)),
   ).toHex();
   const result = await getJson<any>(
      url(baseUrl, { q, from, to, appid, salt, sign }),
   );
   if (result.error_code) return null;
   return result.trans_result[0].dst;
};

export default translate;

if (import.meta.main) {
   console.log(await translate(Deno.args[0]));
}
