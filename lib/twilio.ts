import { Twilio } from "@sholvoir/generic/twilio";

export const twilio = new Twilio(Deno.env.get('TWILIO_ACCOUNT_SID')!,
    Deno.env.get('TWILIO_AUTH_TOKEN')!,
    Deno.env.get('TWILIO_SERVICE_ID')!
);