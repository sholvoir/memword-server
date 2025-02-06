export interface IWordList {
    wlid: string;
    version: string;
}

const regex = /^(.+?)\/(.+)$/;
export const splitID = (id: string) => {
    const m = regex.exec(id);
    if (m) return [m[1], m[2]]
}