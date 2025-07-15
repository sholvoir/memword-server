import { DOMParser } from '@b-fuze/deno-dom';
import { ICard, IMeaning } from "./idict.ts";
const definitionUrl = 'https://www.oxfordlearnersdictionaries.com/us/definition/english'
const baseUrl = 'https://www.oxfordlearnersdictionaries.com/us/search/english';
const reqInit: RequestInit = {
    headers: { 'User-Agent': 'Thunder Client (https://www.thunderclient.com)'}
}
export async function fillDict(word: string, card: ICard, id?: string): Promise<ICard> {
    const reqUrl = id ? `${definitionUrl}/${id}` : `${baseUrl}/?q=${encodeURIComponent(word)}`
    const res = await fetch(reqUrl, reqInit);
    if (!res.ok) return card;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    // get sound & phonetic
    if (!card.phonetic || !card.sound) {
        const div = doc.querySelector('div.audio_play_button.pron-us');
        if (!card.phonetic) {
            const nodes = div?.nextSibling?.childNodes;
            if (nodes) for (const node of nodes) {
                if (node.nodeType == node.TEXT_NODE) {
                    card.phonetic = `${node.textContent}`;
                    break;
                }
            }
        }
        if (!card.sound) {
            const sound = div?.getAttribute('data-src-mp3');
            if (sound) card.sound = sound;
        }
    }
    // get meanings
    if (!card.meanings) {
        const pos = doc.querySelector('div.webtop')?.querySelector('span.pos')?.innerText
        const meanings: Array<IMeaning> = [{pos, meaning: []}];
        const ol = doc.querySelector('ol.sense_single, ol.senses_multiple')
        if (ol) for (const li of ol.querySelectorAll('li.sense')) {
                const v = li.querySelector('.sensetop>.variants>.v-g>.v');
                const grammar = li.querySelector('span.grammar');
                const labels = li.querySelector('span.labels');
                const cf = li.querySelector('span.cf')
                const dtxt = li.querySelector('span.dis-g')?.querySelector('span.dtxt');
                const def = li.querySelector('span.def');
                let t = '';
                if (v) t += `<${v.innerText}> `;
                if (grammar) t += grammar.innerText;
                if (labels) t+= labels.innerText;
                if (cf) t+= `<${cf.innerText}>`;
                if (dtxt) t+= `(${dtxt.innerText})`;
                if (def) meanings[0].meaning?.push({def: `${t} ${def.innerText}`});
            }
        if (meanings[0].meaning?.length) card.meanings = meanings;
    }
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}, word));