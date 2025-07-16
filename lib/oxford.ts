import { DOMParser, HTMLDocument } from '@b-fuze/deno-dom';
import { ICard, IMeaning } from "./idict.ts";
const baseUrl = 'https://www.oxfordlearnersdictionaries.com/us/search/english';
const regId = new RegExp('/([\\w_+-]+)$');
const reqInit: RequestInit = {
    headers: { 'User-Agent': 'Thunder Client (https://www.thunderclient.com)'}
}
export async function fillDict(word: string, card: ICard): Promise<ICard> {
    const ids = new Set<string>();
    const phonetics = new Set<string>();
    const meanings: Array<IMeaning> = [];
    const fill = (doc: HTMLDocument) => {
        // get sound & phonetic
        const div = doc.querySelector('div.audio_play_button.pron-us');
        const nodes = div?.nextSibling?.childNodes;
        if (nodes) for (const node of nodes)
            if (node.nodeType == node.TEXT_NODE)
                phonetics.add(node.textContent);
        if (!card.sound) {
            const sound = div?.getAttribute('data-src-mp3');
            if (sound) card.sound = sound;
        }
        // get meanings
        const pos = doc.querySelector('div.webtop')?.querySelector('span.pos')?.textContent;
        const meaning: IMeaning = { pos, meaning: [] };
        const ol = doc.querySelector('ol.sense_single, ol.senses_multiple')
        if (ol) for (const li of ol.querySelectorAll('li.sense')) {
            const t = [];
            for (const labels of li.querySelectorAll(':scope>.sensetop>span.labels')) t.push(labels.textContent);
            for (const labels of li.querySelectorAll(':scope>span.labels')) t.push(labels.textContent);
            for (const grammar of li.querySelectorAll(':scope>span.grammar')) t.push(grammar.textContent);
            for (const use of li.querySelectorAll(':scope>span.use')) t.push(use.textContent);
            for (const disg of li.querySelectorAll(':scope>span.dis-g')) t.push(disg.textContent);
            for (const def of li.querySelectorAll(':scope>.sensetop>span.def')) t.push(def.textContent);
            for (const def of li.querySelectorAll(':scope>span.def')) t.push(def.textContent);
            // const cf = li.querySelector('span.cf')
            // if (cf) t.push(`<${cf.textContent}>`);
            if (t.length) meaning.meaning?.push({def: t.join(' ')});
        }
        if (meaning.meaning?.length) meanings.push(meaning);
    }
    const useIdFill = async (href: string, f: boolean) => {
        const res = await fetch(href, reqInit);
        if (!res.ok) return;
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        if (f) fill(doc);
        const nearby = doc.querySelector('.nearby>.list-col');
        if (!nearby) return;
        for (const li of nearby.children) if (li.tagName === 'LI')
            for (const a of li.querySelectorAll('a')) {
                const href = a.getAttribute('href');
                if (!href) continue;
                const m = regId.exec(href);
                if (!m) continue;
                const id = m[1];
                if (id.replaceAll(/[\d_]/g, '') != word.toLowerCase()) continue;
                if (ids.has(id)) continue;
                ids.add(id);
                await useIdFill(href, true);
            }
    }
    await useIdFill(`${baseUrl}/?q=${encodeURIComponent(word)}`, false);
    if (!card.phonetic) card.phonetic = Array.from(phonetics).join();
    if (meanings.length) {
        if (!card.meanings) card.meanings = meanings;
        else card.meanings = [...card.meanings, ...meanings];
    }
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));