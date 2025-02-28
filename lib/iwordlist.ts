export interface IWordList {
    wlid: string;
    version: string;
    disc?: string;
}

export const compareWL = (a: IWordList, b: IWordList) =>
    a.wlid.localeCompare(b.wlid);
    

const regex = /^(.+?)\/(.+)$/;
export const splitID = (id: string): [string, string] => {
    const m = regex.exec(id);
    if (m) return [m[1], m[2]]
    return ['', ''];
}