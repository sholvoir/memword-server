import { type IMail } from "@sholvoir/deno-smtp";

const MAIL_URL = "https://mail-378494546801.us-central1.run.app";

const headers = new Headers([
    ["Content-Type", "application/json"],
    ["Authorization", `Bearer ${Deno.env.get("MAIL_TOKEN")}`],
]);

export const sendEmail = async (mail: IMail) => {
    return await fetch(MAIL_URL, {
        headers,
        method: "POST",
        body: JSON.stringify(mail),
    });
};
