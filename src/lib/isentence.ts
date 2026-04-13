import type { ITrace } from "./itrace.ts";

export interface ISentence extends ITrace {
   sentence: string;
   trans?: string;
}
