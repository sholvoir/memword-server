// deno-lint-ignore-file no-cond-assign
import { B2_BASE_URL, B2_BUCKET } from "./common.ts";
import { versionpp } from "@sholvoir/generic/versionpp";
import { minio } from "./minio.ts";
import { collectionWordList } from "./mongo.ts";

const ignoreWlid = 'system/spell-check-ignore';
const ignoreSet = new Set<string>();
let currentIgnoreVersion: string;

const getIgnore = async () => {
    const ignoreVersion = (await collectionWordList.findOne({ wlid: ignoreWlid }))?.version ?? '0.0.1';
    if (currentIgnoreVersion !== ignoreVersion) {
        const res = await fetch(`${B2_BASE_URL}/${ignoreWlid}-${ignoreVersion}.txt`);
        if (!res.ok) throw new Error('Network Error!');
        ignoreSet.clear();
        for (let line of (await res.text()).split('\n')) if (line = line.trim()) ignoreSet.add(line);
        currentIgnoreVersion = ignoreVersion;
    }
}

const wlid = 'system/spell-check';
const scSet = new Set<string>();
let scVersion: string | undefined;
let added = false;
let funcIndex = 0;

const getData = async () => {
    scVersion = (await collectionWordList.findOne({ wlid: wlid }))?.version ?? '0.0.1';
    if (!scVersion) await collectionWordList.insertOne({ wlid: wlid, version: (scVersion = '0.0.1') });
    const res = await fetch(`${B2_BASE_URL}/${wlid}-${scVersion}.txt`);
    if (!res.ok) throw new Error('Network Error!');
    for (let line of (await res.text()).split('\n')) if (line = line.trim()) scSet.add(line);
}

// const spliteNum = /^([A-Za-zèé /&''.-]+)(\d*)/;
const entitiesRegex = /&(quot|apos|amp|lt|gt|#(x?\d+));/g;
const markRegex = /<.*?>/g;
const entities: Record<string, string> = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' };
const decodeEntities = (_: string, p1: string, p2: string) => p2 ? String.fromCharCode(+`0${p2}`) : entities[p1];
const reqInit = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0' } };
const getScfunc = (baseUri: string, regexes: Array<[RegExp, number]>) => async (word: string) => {
    try {
        const result = [];
        const html = await (await fetch(`${baseUri}${encodeURIComponent(word)}`, reqInit)).text();
        for (const [regex, index] of regexes)
            for (const match of html.matchAll(regex))
                result.push(match[index ?? 1].trim().replaceAll(entitiesRegex, decodeEntities).replaceAll(markRegex, ''));
        return result;
    } catch (e) { return (console.log(e), []); }
};

const scfuncs = [
    getScfunc('https://www.merriam-webster.com/dictionary/',
        [[/<(?:h1|p) class="hword">(?:<span.*?>)?(.+?)(?:<\/span>)?<\/(?:h1|p)>/g, 1],
        [/<span class="fw-bold ure">(.+?)<\/span>/g, 1],
        [/<span id=".*?" class="va">(.+?)<\/span>/g, 1]]),
    getScfunc('https://www.oxfordlearnersdictionaries.com/us/search/english/?q=',
        [[/<h1 class="headword".*?>(.+?)<\/h1>/g, 1]]),
    getScfunc('https://www.dictionary.com/browse/',
        [[/<(p|h1) class="(?:elMfuCTjKMwxtSEEnUsi)?">(.*?)<\/\1>/g, 2]])
];

const update = async () => {
    added = false;
    const newVersion = versionpp(scVersion!);
    await minio.putObject(B2_BUCKET, `${wlid}-${newVersion}.txt`,
        Array.from(scSet).sort().join('\n'), 'text/plain');
    await collectionWordList.updateOne({ wlid }, { $set: { version: newVersion } });
    await minio.removeObject(B2_BUCKET, `${wlid}-${scVersion}.txt`);
    scVersion = newVersion;
}

export const check = async (lines: Iterable<string>): Promise<[Set<string>, Record<string, Array<string>>]> => {
    const words = new Set<string>();
    const replaces: Record<string, Array<string>> = {};
    await getIgnore();
    if (!scSet.size) await getData();
    A: for (let word of lines) if (word = word.trim()) {
        if (ignoreSet.has(word)) { words.add(word); continue; }
        if (scSet.has(word)) { words.add(word); continue; }
        const replace = new Set<string>();
        for (let i = 0; i < scfuncs.length; i++) {
            const funIndex = funcIndex++ % scfuncs.length;
            const entries = await scfuncs[funIndex](word);
            if (entries.includes(word)) { scSet.add(word); added = true; words.add(word); continue A; }
            else entries.forEach(entry => replace.add(entry));
        }
        replaces[word] = Array.from(replace);
    }
    if (added) update();
    return [words, replaces];
}

export const getVocabulary = async () => {
    await getIgnore();
    if (!scSet.size) await getData();
    return scSet.union(ignoreSet);
}