import { IDict } from "./idict.ts";

const baseUrl = 'https://dict.youdao.com/jsonapi';
const youdaoAudio = 'https://dict.youdao.com/dictvoice?audio='//complete&type=2
const collinsTail = /(?<=[\.\?] )([\W; ]+?)$/;
const replace: Record<string, string> = { '，':',', '、':',', '；':';', '（':'(', '）':')', ' ':'' };
const refine = (o?: string) => o?.replaceAll(/([，、；（）]|(?<!\w) (?!\w))/g, m => replace[m]);
const abbr = (partofspeech?: string) => {
    if (!partofspeech) return '';
    const p = partofspeech.toLowerCase()
    if (p.startsWith('n')) return 'n.';
    if (p.startsWith('v')) return 'v.';
    if (p.startsWith('adj')) return 'adj.';
    if (p.startsWith('adv')) return 'adv.';
    if (p.startsWith('pron')) return 'pron.';
    if (p.startsWith('prep')) return 'prep.';
    if (p.startsWith('conj')) return 'conj.';
    if (p.startsWith('interj')) return 'interj.';
    return p;
}

const fillDict = async (dict: IDict): Promise<void> => {
    const en = dict.word;
    const resp = await fetch(`${baseUrl}?q=${encodeURIComponent(en)}`);
    if (!resp.ok) return;
    const root = await resp.json();
    const nameRegex = new RegExp(`【名】|（人名）|（${en}）人名`, 'i');
    // Collins Primary Dict
    if ((!dict.phonetic || !dict.sound) && root.collins_primary) {
        const cp = root.collins_primary;
        if (cp.words?.word === en && cp.gramcat?.length) {
            for (const gram of root.collins_primary.gramcat) {
                if (!dict.phonetic && gram.pronunciation) dict.phonetic = `/${gram.pronunciation}/`;
                if (!dict.sound && gram.audiourl) dict.sound = gram.audiourl;
            }
        }
    }
    // Simple Dict
    if ((!dict.phonetic || !dict.sound) && root.simple?.word?.length) for (const x of root.simple?.word) {
        if (x['return-phrase'] !== en) continue;
        if (!dict.phonetic && x.usphone) dict.phonetic = `/${x.usphone}/`;
        if (!dict.sound && x.usspeech) dict.sound = `${youdaoAudio}${x.usspeech}`;
    }
    // English-Chinese Dict
    if ((!dict.trans || !dict.phonetic || !dict.sound) && root.ec?.word?.length) {
        const ts = [];
        for (const x of root.ec?.word) {
            if (!dict.phonetic && x.usphone) dict.phonetic = `/${x.usphone}/`;
            if (!dict.sound && x.usspeech) dict.sound = `${youdaoAudio}${x.usspeech}`;
            if (x.trs?.length) for (const y of x.trs) {
                if (y.tr?.length) for (const z of y.tr) {
                    if (z.l?.i?.length) for (const w of z.l.i) {
                        if (w.match(nameRegex)) continue;
                        ts.push(refine(w));
                    }
                }
            }
        }
        if (!dict.trans && ts.length) dict.trans = ts.join('\n');
    }
    // Collins Dict
    if (!dict.trans && root.collins?.collins_entries?.length) {
        const collinsTran = new RegExp(`<b>${en}`, 'i');
        const ts = [];
        for (const x of root.collins.collins_entries) {
            if (x.entries?.entry?.length) for (const y of x.entries.entry) {
                if (y.tran_entry?.length) for (const z of y.tran_entry) {
                    if ((z.headword && z.headword !== en) || z.pos_entry?.pos?.toLowerCase().includes('phrase')) continue;
                    if (z.tran?.match(collinsTran)) {
                        const m = z.tran.match(collinsTail);
                        if (m) ts.push(`${abbr(z.pos_entry?.pos)}${refine(m[1])}`);
                    }
                }
            }
        }
        if (ts.length) dict.trans = ts.join('\n');
    }
    // Individual Dict
    if (!dict.trans && root.individual?.trs?.length) {
        const ts = [];
        for (const x of root.individual.trs) ts.push(`${x.pos}${refine(x.tran)}`);
        if (ts.length) dict.trans = ts.join('\n');
    }
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) {
    const dict = {word};
    await fillDict(dict);
    console.log(dict);
}