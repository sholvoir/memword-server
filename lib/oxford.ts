import { DOMParser } from '@b-fuze/deno-dom';
import { ICard } from "./idict.ts";

const baseUrl = 'https://www.oxfordlearnersdictionaries.com/us/definition/english/';

async function fillDict(word: string, card: ICard): Promise<ICard> {
    const reqInit = { headers: { 'User-Agent': 'Thunder Client (https://www.thunderclient.com)'} }
    const res = await fetch(`${baseUrl}/${encodeURIComponent(word)}_1?q=${word}`, reqInit);
    if (!res.ok) return card;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const div = doc.querySelector('div.audio_play_button.pron-us');
    const span = div?.nextSibling;
    if (span?.childNodes && !card.phonetic) for (const node of span?.childNodes) {
        if (node.nodeType == node.TEXT_NODE) {
            card.phonetic = `${node.textContent}`;
            break;
        }
    }
    const sound = div?.getAttribute('data-src-mp3');
    if (sound && !card.sound) card.sound = sound;
    return card
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));