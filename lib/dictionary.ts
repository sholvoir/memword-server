// deno-lint-ignore-file no-explicit-any
import { IDict } from "./idict.ts";

const baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const filenameRegExp = new RegExp(`^https://.+?/([\\w'_-]+.(mp3|ogg))$`);

async function fillDict(dict: IDict): Promise<void> {
    const res = await fetch(`${baseUrl}/${encodeURIComponent(dict.word)}`);
    if (!res.ok) return;
    const entries = await res.json();
    const phonetics = entries.flatMap((e: any) => e.phonetics) as any[];
    if ((!dict.phonetic || !dict.sound)) {
        let oscore = 5;
        for (const entry of entries) if (entry.phonetics) for (const ph of phonetics) {
            let score = 10;
            if (ph.audio) {
                const m = ph.audio.match(filenameRegExp);
                if (m) {
                    const fileName = m[1] as string;
                    if (fileName) {
                        if (fileName.includes('-us')) score++;
                        if (fileName.includes('-uk')) score--;
                        if (fileName.includes('-au')) score--;
                        if (fileName.includes('-stressed')) score++;
                        if (fileName.includes('-unstressed')) score--;
                    } else score = 6;
                } else score = 6;
            } else score = 6;
            if (score > oscore) {
                if (ph.text) dict.phonetic = ph.text;
                if (ph.audio) dict.sound = ph.audio;
                oscore = score;
            }
        }
    }
    if (!dict.def) {
        let def = '';
        for (const entry of entries) if (entry.meanings) for (const meaning of entry.meanings) {
            def += `${meaning.partOfSpeech}\n`;
            if (meaning.definitions) for (const definition of meaning.definitions)
                def += `    ${definition.definition}\n`;
        }
        dict.def = def;
    }
}

export default fillDict;

if (import.meta.main) console.log(await fillDict({word: Deno.args[0]}));
