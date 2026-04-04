export interface IBook {
   bid: string;
   checksum: string;
   public?: boolean;
   disc?: string;
   content?: Iterable<string>;
}
