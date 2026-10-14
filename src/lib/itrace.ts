export interface ITrace {
   last: number;
   next: number;
   level: number;
}

export interface IIDTrace extends ITrace {
   id: string;
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

export const toIDTrace = <T extends IIDTrace>({
   id,
   last,
   next,
   level,
}: T): IIDTrace => ({
   id,
   last,
   next,
   level,
});
