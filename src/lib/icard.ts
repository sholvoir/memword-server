import type { ITrace } from "./itrace.ts";

export interface ICard extends ITrace {
   id: string;
   card: string;
}
