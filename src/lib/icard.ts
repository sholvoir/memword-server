import type { ITrace } from "./itrace.ts";

export interface ICard extends ITrace {
   silence?: boolean;
   page?: string;
}
