import { Hono } from "hono";
import { cors } from "hono/cors";
import pkg from "../deno.json" with { type: "json" };
import book from "./api/book.ts";
import statik from "./api/index.ts";
import issue from "./api/issue.ts";
import sentence from "./api/sentence.ts";
import setting from "./api/setting.ts";
import sign from "./api/sign.ts";
import task from "./api/task.ts";
import trans from "./api/trans.ts";
import type { jwtEnv } from "./lib/env.ts";
import { connect } from "./lib/mongo.ts";

const API_BASE = "/api/v2";

const run = async () => {
   const app = new Hono<jwtEnv>();
   app.use(
      cors({
         origin: "*",
         credentials: true,
         allowHeaders: ["Accept", "Content-Type", "Authorization"],
      }),
   );
   statik(app);
   sign(app);
   app.get(`${API_BASE}/version`, (c) => c.text(pkg.version));

   app.route(`${API_BASE}/book`, book);
   app.route(`${API_BASE}/task`, task);
   app.route(`${API_BASE}/trans`, trans);
   app.route(`${API_BASE}/issue`, issue);
   app.route(`${API_BASE}/setting`, setting);
   app.route(`${API_BASE}/sentence`, sentence);

   await connect();
   Deno.serve(app.fetch);
};

if (import.meta.main) run();
