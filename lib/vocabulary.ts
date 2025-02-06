// deno-lint-ignore-file no-cond-assign
import { B2_BASE_URL, B2_BUCKET } from "./common.ts";
import { versionpp } from "@sholvoir/generic/versionpp";
import { minio } from './minio.ts';
import { collectionWordList } from "./mongo.ts";

const wlid = 'system/vocabulary';
const vocab = new Set<string>();
let version: string | undefined;

export const get = async () => {
    if (vocab.size) return vocab;
    version = (await collectionWordList.findOne({ wlid: wlid }))?.version;
    if (!version) await collectionWordList.insertOne({ wlid: wlid, version: (version = '0.3.3') });
    const res = await fetch(`${B2_BASE_URL}/${wlid}-${version}.txt`);
    if (!res.ok) throw new Error('Network Error!');
    for (let line of (await res.text()).split('\n')) if (line = line.trim()) vocab.add(line);
    return vocab;
}

export const add = async (words: Iterable<string>) => {
    await get();
    const oldSize = vocab.size;
    for (const word of words) vocab.add(word);
    const newSize = vocab.size;
    if (newSize > oldSize) {
        const newVersion = versionpp(version!);
        await minio.putObject(B2_BUCKET, `${wlid}-${newVersion}.txt`,
            Array.from(vocab).sort().join('\n'), 'text/plain');
        await collectionWordList.updateOne({ wlid: wlid }, { $set: { version: newVersion } });
        await minio.removeObject(B2_BUCKET, `${wlid}-${version}.txt`);
        version = newVersion;
    }
}