import { JWT } from "@sholvoir/generic/jwt";

export const jwt = new JWT({ iss: "micinfotech.com", sub: "memword" });
await jwt.importKey(Deno.env.get("APP_KEY"));
