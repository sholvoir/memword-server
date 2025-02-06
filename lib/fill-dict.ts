import { IDict } from "./idict.ts";
import dictionary from "./dictionary.ts";
import oxford from "./oxford.ts";
import websterApi from "./webster-api.ts";
import websterWeb from "./webster-web.ts";
import youdao from "./youdao.ts";

export default async (dict: IDict) => {
    // Webster-api
    if (!dict.sound) await websterApi(dict);
    // Webster-web
    if (!dict.sound) await websterWeb(dict);
    // Oxford
    if (!dict.phonetic || !dict.sound) await oxford(dict);
    // Youdao
    if (!dict.trans || !dict.phonetic || !dict.sound) await youdao(dict);
    // Google Dictionary
    if (!dict.sound || !dict.phonetic || !dict.def) await dictionary(dict);
}