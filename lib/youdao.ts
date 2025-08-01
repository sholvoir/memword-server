import { IEntry, IMean } from "@sholvoir/memword-common/idict";

const baseUrl = 'https://dict.youdao.com/jsonapi';
const youdaoAudio = 'https://dict.youdao.com/dictvoice?audio='//complete&type=2
const collinsTail = /(?<=[\.\?] )([\W; ]+?)$/;
const replace: Record<string, string> = { '，':',', '、':',', '；':';', '（':'(', '）':')', ' ':'' };
const refine = (o?: string) => o?.replaceAll(/([，、；（）]|(?<!\w) (?!\w))/g, m => replace[m]);

const fillDict = async (en: string, entry: IEntry): Promise<IEntry> => {
    const resp = await fetch(`${baseUrl}?q=${encodeURIComponent(en)}`);
    if (!resp.ok) return entry;
    const root = await resp.json();
    const nameRegex = new RegExp(`【名】|（人名）|（${en}）人名`, 'i');
    // Collins Primary Dict
    if ((!entry.phonetic || !entry.sound) && root.collins_primary) {
        const cp = root.collins_primary;
        if (cp.words?.word === en && cp.gramcat?.length) {
            for (const gram of root.collins_primary.gramcat) {
                if (!entry.phonetic && gram.pronunciation) entry.phonetic = `/${gram.pronunciation}/`;
                if (!entry.sound && gram.audiourl) entry.sound = gram.audiourl;
            }
        }
    }
    // Simple Dict
    if ((!entry.phonetic || !entry.sound) && root.simple?.word?.length) for (const x of root.simple?.word) {
        if (x['return-phrase'] !== en) continue;
        if (!entry.phonetic && x.usphone) entry.phonetic = `/${x.usphone}/`;
        if (!entry.sound && x.usspeech) entry.sound = `${youdaoAudio}${x.usspeech}`;
    }
    // Collins Dict
    if (!entry.meanings && root.collins?.collins_entries?.length) {
        const collinsTran = new RegExp(`<b>${en}`, 'i');
        const meanings: Record<string, Array<IMean>> = {};
        for (const x of root.collins.collins_entries) {
            if (x.entries?.entry?.length) for (const y of x.entries.entry) {
                if (y.tran_entry?.length) for (const z of y.tran_entry) {
                    const pos = z.pos_entry?.pos;
                    if ((z.headword && z.headword !== en) || pos?.toLowerCase().includes('phrase')) continue;
                    if (z.tran?.match(collinsTran)) {
                        const m = z.tran.match(collinsTail);
                        if (m) {
                            const item = {def: refine(m[1])};
                            if (meanings[pos]) meanings[pos].push(item);
                            else meanings[pos] = [item];
                        }
                    }
                }
            }
        }
        if (Object.keys(meanings).length) entry.meanings = meanings;
    }
    // Individual Dict
    if (!entry.meanings && root.individual?.trs?.length) {
        const meanings: Record<string, Array<IMean>> = {};
        for (const x of root.individual.trs) {
            const item = {trans: refine(x.tran)};
            if (meanings[x.pos]) meanings[x.pos].push(item);
            else meanings[x.pos] = [item]
        }
        if (Object.keys(meanings).length) entry.meanings = meanings;
    }
    // English-Chinese Dict
    if (root.ec?.word?.length) {
        const means: Array<IMean> = [];
        for (const x of root.ec?.word) {
            if (!entry.phonetic && x.usphone) entry.phonetic = `/${x.usphone}/`;
            if (!entry.sound && x.usspeech) entry.sound = `${youdaoAudio}${x.usspeech}`;
            if (x.trs?.length) for (const y of x.trs) {
                if (y.tr?.length) for (const z of y.tr) {
                    if (z.l?.i?.length) for (const w of z.l.i) {
                        if (w.match(nameRegex)) continue;
                        means.push({ trans: refine(w)} );
                    }
                }
            }
        }
        if (!entry.meanings) entry.meanings = { ecdict: means };
        else entry.meanings = {ecdict: means, ...entry.meanings};
    }
    return entry;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));