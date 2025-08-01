import { DOMParser, HTMLDocument } from '@b-fuze/deno-dom';
import { IEntry, IMean } from "@sholvoir/memword-common/idict";
const baseUrl = 'https://www.oxfordlearnersdictionaries.com/us/search/english';
const regId = new RegExp('/([\\w_+-]+)$');
const reqInit: RequestInit = {
    headers: { 'User-Agent': 'Thunder Client (https://www.thunderclient.com)'}
}
const reg = /[‘’]/g;
export async function fillDict(word: string, entry: IEntry): Promise<IEntry> {
    const ids = new Set<string>();
    const phonetics = new Set<string>();
    const meanings: Record<string, Array<IMean>> = {}
    const fill = (doc: HTMLDocument) => {
        // get sound & phonetic
        const div = doc.querySelector('div.audio_play_button.pron-us');
        const nodes = div?.nextSibling?.childNodes;
        if (nodes) for (const node of nodes)
            if (node.nodeType == node.TEXT_NODE)
                phonetics.add(node.textContent);
        if (!entry.sound) {
            const sound = div?.getAttribute('data-src-mp3');
            if (sound) entry.sound = sound;
        }
        // get meanings
        const pos = doc.querySelector('div.webtop')?.querySelector('span.pos')?.textContent;
        const means: Array<IMean> = [];
        const ol = doc.querySelector('ol.sense_single, ol.senses_multiple');
        if (ol) for (const li of ol.querySelectorAll('li.sense')) {
            const t = [];
            for (const sensetop of li.querySelectorAll(':scope>span.sensetop>span'))
                t.push(sensetop.classList.contains('cf') ? `(${sensetop.textContent})` : sensetop.textContent);
            for (const grammar of li.querySelectorAll(':scope>span.grammar')) t.push(grammar.textContent);
            for (const cf of li.querySelectorAll(':scope>span.cf')) t.push(`(${cf.textContent})`);
            for (const labels of li.querySelectorAll(':scope>span.labels')) t.push(labels.textContent);
            for (const use of li.querySelectorAll(':scope>span.use')) t.push(use.textContent);
            for (const disg of li.querySelectorAll(':scope>span.dis-g')) t.push(disg.textContent);
            for (const def of li.querySelectorAll(':scope>span.def')) t.push(def.textContent);
            if (t.length) means.push({def: t.join(' ').replaceAll(reg, "'")});
        }
        meanings[pos!] = means;
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
                let w = '';
                B: for (const hwd of a.querySelectorAll('data.hwd'))
                    for (const x of hwd.childNodes)
                        if (x.nodeType == x.TEXT_NODE) {
                            w = x.textContent.trim();
                            break B;
                        }
                if (w != word) continue;
                if (ids.has(id)) continue;
                ids.add(id);
                await useIdFill(href, true);
            }
    }
    await useIdFill(`${baseUrl}/?q=${encodeURIComponent(word)}`, false);
    if (!Object.keys(meanings).length)
        await useIdFill(`${baseUrl}/?q=${encodeURIComponent(word)}`, true);
    if (!entry.phonetic) entry.phonetic = Array.from(phonetics).join();
    if (Object.keys(meanings).length) {
        if (!entry.meanings) entry.meanings = meanings;
        else entry.meanings = {...entry.meanings, ...meanings};
    }
    return entry;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));