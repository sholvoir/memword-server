import { ICard } from "./idict.ts";
import dictionary from "./dictionary.ts";
import oxford from "./oxford.ts";
import websterApi from "./webster-api.ts";
import websterWeb from "./webster-web.ts";
import youdao from "./youdao.ts";

const fillDict = async (word: string, card: ICard) => {
    // Webster-api //if (!card.sound) 
    await websterApi(word, card);
    console.log(1, card)
    // Webster-web
    if (!card.sound) await websterWeb(word, card);
    console.log(2, card)
    // Oxford //if (!card.phonetic || !card.sound) 
    await oxford(word, card);
    console.log(3, card)
    // Google Dictionary //(!card.sound || !card.phonetic || !card.def)
    await dictionary(word, card);
    console.log(4, card)
    // Youdao // (!card.sound || !card.phonetic || !card.def)
    await youdao(word, card);
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) console.log(await fillDict(word, {}));