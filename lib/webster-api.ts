import { IEntry } from "@sholvoir/memword-common/idict";

const baseUrl = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json';
const soundBase = 'https://media.merriam-webster.com/audio/prons/en/us/mp3';
const key = Deno.env.get('DICTIONARY_API_COM_DICTIONARY');
const regex = /^[A-Za-z]/
const getSubdirectory = (word: string) => {
    if (word.startsWith('bix')) return 'bix';
    if (word.startsWith('gg')) return 'gg';
    if (regex.test(word)) return word.at(0);
    return 'number';
}

async function fillDict(word: string, entry: IEntry): Promise<IEntry> {
    if (entry.sound) return entry;
    const res = await fetch(`${baseUrl}/${encodeURIComponent(word)}?key=${key}`);
    if (!res.ok) return entry;
    const root = await res.json();
    const element = root[0];
    if (typeof element === 'string') return entry;
    const audio = element.hwi?.prs?.[0]?.sound?.audio;
    if (audio) entry.sound = `${soundBase}/${getSubdirectory(audio)}/${audio}.mp3`;
    return entry;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));