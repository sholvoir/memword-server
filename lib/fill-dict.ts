import { ICard } from "./idict.ts";
import dictionary from "./dictionary.ts";
import oxford from "./oxford.ts";
import websterApi from "./webster-api.ts";
import websterWeb from "./webster-web.ts";
import youdao from "./youdao.ts";

export default async (word: string, card: ICard) => {
    // Webster-api
    if (!card.sound) await websterApi(word, card);
    // Webster-web
    if (!card.sound) await websterWeb(word, card);
    // Oxford
    if (!card.phonetic || !card.sound) await oxford(word, card);
    // Youdao
    if (!card.trans || !card.phonetic || !card.sound) await youdao(word, card);
    // Google Dictionary
    if (!card.sound || !card.phonetic || !card.def) await dictionary(word, card);
    return card;
}