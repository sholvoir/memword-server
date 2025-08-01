import { IEntry } from "@sholvoir/memword-common/idict";

const baseUrl = 'https://www.merriam-webster.com/dictionary';
const mp3Regex = new RegExp(`"contentURL": "(https://media.merriam-webster.com/audio/prons/en/us/.+?mp3)"`);

const fillDict = async (word: string, entry: IEntry): Promise<IEntry> => {
    if (entry.sound) return entry;
    const resp = await fetch(`${baseUrl}/${encodeURIComponent(word)}`);
    if (resp.ok) entry.sound = (await resp.text())?.match(mp3Regex)?.[1];
    return entry;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));