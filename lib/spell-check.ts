import { getHash } from "@sholvoir/generic/hash";
import { getObject, putObject } from "./s3.ts";

const bid = "vocabulary";
const _vocab = new Set<string>();
let _checksum = "";
let funcIndex = 0;

// const spliteNum = /^([A-Za-zèé /&''.-]+)(\d*)/;
const entitiesRegex = /&(quot|apos|amp|lt|gt|#(x?\d+));/g;
const markRegex = /<.*?>/g;
const entities: Record<string, string> = {
   quot: '"',
   apos: "'",
   amp: "&",
   lt: "<",
   gt: ">",
};
const decodeEntities = (_: string, p1: string, p2: string) =>
   p2 ? String.fromCharCode(+`0${p2}`) : entities[p1];
const reqInit = {
   headers: {
      "User-Agent":
         "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
   },
};
const getScfunc =
   (baseUri: string, regexes: Array<[RegExp, number]>) =>
   async (word: string) => {
      try {
         const result = [];
         const html = await (
            await fetch(`${baseUri}${encodeURIComponent(word)}`, reqInit)
         ).text();
         for (const [regex, index] of regexes)
            for (const match of html.matchAll(regex))
               result.push(
                  match[index ?? 1]
                     .trim()
                     .replaceAll(entitiesRegex, decodeEntities)
                     .replaceAll(markRegex, ""),
               );
         return result;
      } catch (e) {
         return console.log(e), [];
      }
   };

const scfuncs = [
   getScfunc("https://www.merriam-webster.com/dictionary/", [
      [
         /<(?:h1|p) class="hword">(?:<span.*?>)?(.+?)(?:<\/span>)?<\/(?:h1|p)>/g,
         1,
      ],
      [/<span class="fw-bold ure">(.+?)<\/span>/g, 1],
      [/<span id=".*?" class="va">(.+?)<\/span>/g, 1],
   ]),
   getScfunc(
      "https://www.oxfordlearnersdictionaries.com/us/search/english/?q=",
      [[/<h1 class="headword".*?>(.+?)<\/h1>/g, 1]],
   ) /*,
    getScfunc('https://www.dictionary.com/browse/',
        [[/<(p|h1) class="(?:elMfuCTjKMwxtSEEnUsi)?">(.*?)<\/\1>/g, 2]])*/,
];

const update = async () => {
   const text = Array.from(_vocab).sort().join("\n");
   await putObject(`${bid}.txt`, text);
   _checksum = await getHash(text);
};

export const addToVocabulary = async (words: Iterable<string>) => {
   const [vocab] = await getVocabulary();
   const oldSize = vocab.size;
   for (const word of words) vocab.add(word);
   if (vocab.size > oldSize) update();
};

export const deleteFromVocabulary = async (words: Iterable<string>) => {
   const [vocab] = await getVocabulary();
   const oldSize = vocab.size;
   for (const word of words) if (vocab.has(word)) vocab.delete(word);
   if (vocab.size < oldSize) update();
};

export const getVocabulary = async () => {
   if (_vocab.size) return [_vocab, _checksum] as const;
   const text = await getObject(`${bid}.txt`);
   _checksum = await getHash(text);
   for (let word of text.split("\n"))
      if ((word = word.trim())) _vocab.add(word);
   return [_vocab, _checksum] as const;
};

export const check = async (
   lines: Iterable<string>,
): Promise<[Set<string>, Record<string, Array<string>>]> => {
   const words = new Set<string>();
   const replaces: Record<string, Array<string>> = {};
   const [vocab] = await getVocabulary();
   let added = false;
   A: for (let word of lines)
      if (word = word.trim()) {
         if (vocab.has(word)) {
            words.add(word);
            continue;
         }
         const replace = new Set<string>();
         for (let i = 0; i < scfuncs.length; i++) {
            const funIndex = funcIndex++ % scfuncs.length;
            const entries = await scfuncs[funIndex](word);
            if (entries.includes(word)) {
               vocab.add(word);
               added = true;
               words.add(word);
               continue A;
            } else entries.forEach((entry) => replace.add(entry));
         }
         replaces[word] = Array.from(replace);
      }
   if (added) update();
   return [words, replaces];
};
