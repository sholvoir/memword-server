import { IEntry } from "@sholvoir/memword-common/idict";
import dictionary from "./dictionary.ts";
import oxford from "./oxford.ts";
import websterApi from "./webster-api.ts";
import websterWeb from "./webster-web.ts";
import youdao from "./youdao.ts";

const fillDict = async (word: string, entry: IEntry) => {
    await websterApi(word, entry); // Webster-api: sound
    if (!entry.sound) await websterWeb(word, entry); // Webster-web: sound
    await oxford(word, entry); // Oxford: phonetic, sound, meanings.def
    if (!entry.meanings) await dictionary(word, entry); // Google Dictionary: meanings.def
    await youdao(word, entry); // Youdao: phonetic, sound, meanings.def, meanings.trans
    return entry;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) console.log(await fillDict(word, {}));