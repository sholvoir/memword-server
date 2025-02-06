import { sendEmail } from "./email.ts";

console.log(
    await sendEmail({
        from: "MEMWORD <memword.sholvoir@gmail.com>",
        to: "sovar.he@gmail.com",
        subject: "Test Email",
        content: "This is a test email.",
    }),
);
