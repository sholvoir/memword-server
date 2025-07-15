import { ICard } from "./idict.ts";
import dictionary from "./dictionary.ts";
import oxford from "./oxford.ts";
import websterApi from "./webster-api.ts";
import websterWeb from "./webster-web.ts";
import youdao from "./youdao.ts";

const fillDict = async (word: string, card: ICard) => {
    await websterApi(word, card); // Webster-api: sound
    if (!card.sound) await websterWeb(word, card); // Webster-web: sound
    await oxford(word, card); // Oxford: phonetic, sound, meanings.def
    if (!card.meanings) await dictionary(word, card); // Google Dictionary: meanings.def
    await youdao(word, card); // Youdao: phonetic, sound, meanings.def, meanings.trans
    return card;
}

export default fillDict;

if (import.meta.main) for (const word of Deno.args) console.log(await fillDict(word, {}));