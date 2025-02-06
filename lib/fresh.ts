export type MemState = { user: string };
export const MONGO_URI = Deno.env.get('MONGO_URI')!;