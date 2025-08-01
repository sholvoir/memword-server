import { IEntry, IMean } from "@sholvoir/memword-common/idict";

const baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';

async function fillDict(word: string, entry: IEntry): Promise<IEntry> {
    if (entry.meanings) return entry;
    const res = await fetch(`${baseUrl}/${encodeURIComponent(word)}`);
    if (!res.ok) return entry;
    const entries = await res.json();
    const meanings: Record<string, Array<IMean>> = {}
    for (const entry of entries) if (entry.meanings) for (const meaning of entry.meanings) {
        const pos = meaning.partOfSpeech as string;
        const means: Array<IMean> = [];
        if (meaning.definitions) for (const definition of meaning.definitions)
            means.push({ def: definition.definition });
        meanings[pos] = means;
    }
    if (Object.keys(meanings).length) entry.meanings = meanings;
    return entry;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) console.log(await fillDict(word, {}));
