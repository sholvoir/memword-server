export interface ICard {
    def?: string;
    trans?: string;
    sound?: string;
    phonetic?: string;
}

export interface IDict {
    _id?: string;
    word: string;
    version: number;
    cards?: Array<ICard>;
}