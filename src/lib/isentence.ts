import type { ITrace } from "./itrace.ts";

export interface ISentence extends ITrace {
   id?: string;
   sentence?: string;
}
