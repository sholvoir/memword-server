import { Hono } from "hono";
import { cors } from "hono/cors";
import book from "./api/book.ts";
import apply from "./api/index.ts";
import issue from "./api/issue.ts";
import otp from "./api/otp.ts";
import renew from "./api/renew.ts";
import setting from "./api/setting.ts";
import signin from "./api/signin.ts";
import signout from "./api/signout.ts";
import signup from "./api/signup.ts";
import task from "./api/task.ts";
import { connect } from "./lib/mongo.ts";

const API_BASE = "/api/v2";

const run = async () => {
   const app = new Hono();
   app.use(
      cors({
         origin: "*",
         credentials: true,
         allowHeaders: ["Accept", "Content-Type", "Authorization"],
      }),
   );
   apply(app);
   app.route(`${API_BASE}/otp`, otp);
   app.route(`${API_BASE}/book`, book);
   app.route(`${API_BASE}/task`, task);
   app.route(`${API_BASE}/renew`, renew);
   app.route(`${API_BASE}/issue`, issue);
   app.route(`${API_BASE}/signup`, signup);
   app.route(`${API_BASE}/signin`, signin);
   app.route(`${API_BASE}/signout`, signout);
   app.route(`${API_BASE}/setting`, setting);

   await connect();
   Deno.serve(app.fetch);
};

if (import.meta.main) run();
