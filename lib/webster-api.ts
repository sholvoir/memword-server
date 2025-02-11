// deno-lint-ignore-file no-explicit-any
import { ICard } from "./idict.ts";

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

async function fillDict(word: string, card: ICard): Promise<ICard> {
    if (card.sound) return card;
    const res = await fetch(`${baseUrl}/${encodeURIComponent(word)}?key=${key}`);
    if (!res.ok) return card;
    const entries = await res.json() as Array<any>;
    const entry = entries[0];
    if (typeof entry === 'string') return card;
    const pr = entry.hwi?.prs?.at(0);
    if (pr?.sound?.audio) card.sound = `${soundBase}/${getSubdirectory(pr.sound.audio)}/${pr.sound.audio}.mp3`;
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));