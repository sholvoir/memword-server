export interface IMeaning {
    pos?: string;
    meaning?: Array<{
        def?: string;
        trans?: string;
    }>
}
export interface ICard {
    sound?: string;
    phonetic?: string;
    meanings?: Array<IMeaning>;
}
export interface IDict {
    _id?: string;
    word: string;
    version?: number;
    cards?: Array<ICard>;
}