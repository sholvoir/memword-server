import type { IIDTrace, ITrace } from "./itrace.ts";

export interface ITask extends ITrace {
   word: string;
}

export interface IIDTask extends IIDTrace {
   word: string;
}
