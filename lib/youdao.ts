import { ICard, IMeaning } from "./idict.ts";

const baseUrl = 'https://dict.youdao.com/jsonapi';
const youdaoAudio = 'https://dict.youdao.com/dictvoice?audio='//complete&type=2
const collinsTail = /(?<=[\.\?] )([\W; ]+?)$/;
const replace: Record<string, string> = { '，':',', '、':',', '；':';', '（':'(', '）':')', ' ':'' };
const refine = (o?: string) => o?.replaceAll(/([，、；（）]|(?<!\w) (?!\w))/g, m => replace[m]);

const fillDict = async (en: string, card: ICard): Promise<ICard> => {
    const resp = await fetch(`${baseUrl}?q=${encodeURIComponent(en)}`);
    if (!resp.ok) return card;
    const root = await resp.json();
    const nameRegex = new RegExp(`【名】|（人名）|（${en}）人名`, 'i');
    // Collins Primary Dict
    if ((!card.phonetic || !card.sound) && root.collins_primary) {
        const cp = root.collins_primary;
        if (cp.words?.word === en && cp.gramcat?.length) {
            for (const gram of root.collins_primary.gramcat) {
                if (!card.phonetic && gram.pronunciation) card.phonetic = `/${gram.pronunciation}/`;
                if (!card.sound && gram.audiourl) card.sound = gram.audiourl;
            }
        }
    }
    // Simple Dict
    if ((!card.phonetic || !card.sound) && root.simple?.word?.length) for (const x of root.simple?.word) {
        if (x['return-phrase'] !== en) continue;
        if (!card.phonetic && x.usphone) card.phonetic = `/${x.usphone}/`;
        if (!card.sound && x.usspeech) card.sound = `${youdaoAudio}${x.usspeech}`;
    }
    // Collins Dict
    if (!card.meanings && root.collins?.collins_entries?.length) {
        const collinsTran = new RegExp(`<b>${en}`, 'i');
        const meanings: Array<IMeaning> = [];
        for (const x of root.collins.collins_entries) {
            if (x.entries?.entry?.length) for (const y of x.entries.entry) {
                if (y.tran_entry?.length) for (const z of y.tran_entry) {
                    if ((z.headword && z.headword !== en) || z.pos_entry?.pos?.toLowerCase().includes('phrase')) continue;
                    if (z.tran?.match(collinsTran)) {
                        const m = z.tran.match(collinsTail);
                        if (m) meanings.push({pos: z.pos_entry?.pos, meaning: [{def: refine(m[1])}]});
                    }
                }
            }
        }
        if (meanings.length) card.meanings = meanings;
    }
    // Individual Dict
    if (!card.meanings && root.individual?.trs?.length) {
        const meanings: Array<IMeaning> = [];
        for (const x of root.individual.trs) 
            meanings.push({pos: x.pos, meaning: [{trans: refine(x.tran)}]})
        if (meanings.length) card.meanings = meanings;
    }
    // English-Chinese Dict
    if (root.ec?.word?.length) {
        const mean: IMeaning = { meaning: [] };
        for (const x of root.ec?.word) {
            if (!card.phonetic && x.usphone) card.phonetic = `/${x.usphone}/`;
            if (!card.sound && x.usspeech) card.sound = `${youdaoAudio}${x.usspeech}`;
            if (x.trs?.length) for (const y of x.trs) {
                if (y.tr?.length) for (const z of y.tr) {
                    if (z.l?.i?.length) for (const w of z.l.i) {
                        if (w.match(nameRegex)) continue;
                        mean.meaning!.push({ trans: refine(w)} );
                    }
                }
            }
        }
        if (!card.meanings) card.meanings = [mean]
        else card.meanings.unshift(mean)
    }
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args)
    console.log(await fillDict(word, {}));