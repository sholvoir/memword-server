// deno-lint-ignore-file no-explicit-any
export interface ITask {
    _id?: any;
    word: string;
    last: number;
    next: number;
    level: number;
}