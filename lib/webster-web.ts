import { ICard } from "./idict.ts";

const baseUrl = 'https://www.merriam-webster.com/dictionary';
const mp3Regex = new RegExp(`"contentURL": "(https://media.merriam-webster.com/audio/prons/en/us/.+?mp3)"`);

const fillDict = async (word: string, card: ICard): Promise<ICard> => {
    if (card.sound) return card;
    const resp = await fetch(`${baseUrl}/${encodeURIComponent(word)}`);
    if (resp.ok) card.sound = (await resp.text())?.match(mp3Regex)?.[1];
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));