export interface ITrace {
   id?: string;
   last: number;
   next: number;
   level: number;
}

export const toTrace = ({ last, next, level }: ITrace): ITrace => ({
   last,
   next,
   level,
});
