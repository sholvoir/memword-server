export interface ICard {
    def?: string;
    sound?: string;
    phonetic?: string;
}

export interface IDict {
    _id?: string;
    word: string;
    version?: number;
    cards?: Array<ICard>;
}