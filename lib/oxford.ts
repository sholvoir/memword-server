import { DOMParser } from '@b-fuze/deno-dom';
import { IDict } from "./idict.ts";

const baseUrl = 'https://www.oxfordlearnersdictionaries.com/us/definition/english/';

async function fillDict(dict: IDict): Promise<void> {
    const reqInit = { headers: { 'User-Agent': 'Thunder Client (https://www.thunderclient.com)'} }
    const res = await fetch(`${baseUrl}/${encodeURIComponent(dict.word)}_1?q=${dict.word}`, reqInit);
    if (!res.ok) return;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const div = doc.querySelector('div.audio_play_button.pron-us');
    const span = div?.nextSibling;
    if (span?.childNodes && !dict.phonetic) for (const node of span?.childNodes) {
        if (node.nodeType == node.TEXT_NODE) {
            dict.phonetic = `${node.textContent}`;
            break;
        }
    }
    const sound = div?.getAttribute('data-src-mp3');
    if (sound && !dict.sound) dict.sound = sound;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) {
    const dict = {word};
    await fillDict(dict);
    console.log(dict);
}