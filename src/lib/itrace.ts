export interface ITrace {
   last: number;
   next: number;
   level: number;
}

export const toTrace = <T extends ITrace>({
   last,
   next,
   level,
}: T): ITrace => ({
   last,
   next,
   level,
});
