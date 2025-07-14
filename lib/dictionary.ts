import { ICard, IMeaning } from "./idict.ts";

const baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';

async function fillDict(word: string, card: ICard): Promise<ICard> {
    if (card.meanings) return card;
    const res = await fetch(`${baseUrl}/${encodeURIComponent(word)}`);
    if (!res.ok) return card;
    const entries = await res.json();
    const meanings: Array<IMeaning> = []
    for (const entry of entries) if (entry.meanings) for (const meaning of entry.meanings) {
        const mean: IMeaning = { pos: meaning.partOfSpeech, meaning: [] };
        if (meaning.definitions) for (const definition of meaning.definitions)
            mean.meaning!.push({ def: definition.definition });
        meanings.push(mean);
    }
    if (meanings.length) card.meanings = meanings;
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) console.log(await fillDict(word, {}));
