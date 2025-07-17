import { ICard, IMeanItem } from "@sholvoir/memword-common/idict";

const baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';

async function fillDict(word: string, card: ICard): Promise<ICard> {
    if (card.meanings) return card;
    const res = await fetch(`${baseUrl}/${encodeURIComponent(word)}`);
    if (!res.ok) return card;
    const entries = await res.json();
    const meanings: Record<string, Array<IMeanItem>> = {}
    for (const entry of entries) if (entry.meanings) for (const meaning of entry.meanings) {
        const pos = meaning.partOfSpeech as string;
        const means: Array<IMeanItem> = [];
        if (meaning.definitions) for (const definition of meaning.definitions)
            means.push({ def: definition.definition });
        meanings[pos] = means;
    }
    if (Object.keys(meanings).length) card.meanings = meanings;
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) console.log(await fillDict(word, {}));
