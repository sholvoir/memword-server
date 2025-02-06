import { IDict } from "./idict.ts";

const baseUrl = 'https://www.merriam-webster.com/dictionary';
const mp3Regex = new RegExp(`"contentURL": "(https://media.merriam-webster.com/audio/prons/en/us/.+?mp3)"`);

const fillDict = async (dict: IDict): Promise<void> => {
    if (dict.sound) return;
    const resp = await fetch(`${baseUrl}/${encodeURIComponent(dict.word)}`);
    if (resp.ok) dict.sound = (await resp.text())?.match(mp3Regex)?.[1];
}

export default fillDict;

if (import.meta.main) {
    const dict = {word: Deno.args[0]};
    await fillDict(dict);
    console.log(dict);
}