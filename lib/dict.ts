import { now } from "@sholvoir/memword-common/common";
import type { IDict, IEntry, IMean } from "@sholvoir/memword-common/idict";

const baseUrl = "https://dict.micinfotech.com/?q=";
const collinsTail = /(?<=[.?] )([\W; ]+?)$/;
const replace: Record<string, string> = {
   "，": ",",
   "、": ",",
   "；": ";",
   "（": "(",
   "）": ")",
   " ": "",
};
const refine = (o?: string) =>
   o?.replaceAll(/([，、；（）]|(?<!\w) (?!\w))/g, (m) => replace[m]);

export const getDict = async (word: string) => {
   const res = await fetch(`${baseUrl}${encodeURIComponent(word)}`);
   if (!res.ok) return;
   const root = await res.json();
   const entry: IEntry = { phonetic: "", meanings: {} };
   const dict: IDict = { word, version: now(), entries: [entry] };
   if (root.webster_web?.sound) entry.sound = root.webster_web.sound;
   if (!entry.sound && root.webster_api) {
      const element = root.webster_api[0];
      if (typeof element !== "string") {
         const audio = element.hwi?.prs?.[0]?.sound?.audio;
         if (audio) entry.sound = audio;
      }
   }
   if (root.oxford_web) {
      const phonetics = new Set<string>();
      for (const element of root.oxford_web)
         if (element.phonetics)
            for (const phonet of element.phonetics)
               if (phonet.geo === "n_am")
                  for (const ph of phonet.phs) {
                     phonetics.add(ph.phon);
                     if (!entry.sound) entry.sound = ph.audio;
                  }
      if (phonetics.size) entry.phonetic = Array.from(phonetics).join(",");
      for (const element of root.oxford_web) {
         if (element.senses) {
            const pos = element.pos ?? "unkown";
            const means: Array<IMean> = [];
            const webtop = [];
            if (element.variants) {
               const variants = [];
               if (element.variants.spec) variants.push(element.variants.spec);
               if (element.variants.labels)
                  variants.push(element.variants.labels);
               if (element.variants.v) variants.push(element.variants.v);
               webtop.push(`(${variants.join(" ")})`);
            }
            if (element.labels) webtop.push(`(${element.labels.join(",")})`);
            if (element.use) webtop.push(element.use);
            if (element.grammar) webtop.push(`(${element.grammar})`);
            if (element.inflections) {
               const inflections = [];
               for (const inflection of element.inflections) {
                  inflections.push(
                     `${inflection.label} ${inflection.inflected ?? ""}`,
                  );
               }
               webtop.push(`(${inflections.join(" ")})`);
            }
            if (element.def) webtop.push(element.def);
            if (webtop.length) means.push({ def: webtop.join(" ") });
            for (const sense of element.senses) {
               const mean = [];
               if (sense.shcut) mean.push(`(${sense.shcut})`);
               if (sense.cf) mean.push(`(${sense.cf})`);
               if (sense.disg) mean.push(`(${sense.disg})`);
               if (sense.grammar) mean.push(sense.grammar);
               if (sense.labels) mean.push(`(${sense.labels.join(",")})`);
               if (sense.use) mean.push(sense.use);
               if (sense.inflections) {
                  const inflections = [];
                  for (const inflection of sense.inflections) {
                     inflections.push(
                        `${inflection.label} ${inflection.inflected ?? ""}`,
                     );
                  }
                  mean.push(`(${inflections.join(" ")})`);
               }
               if (sense.variants) {
                  const variants = [];
                  if (sense.variants.spec) variants.push(sense.variants.spec);
                  if (sense.variants.labels)
                     variants.push(sense.variants.labels);
                  if (sense.variants.v) variants.push(sense.variants.v);
                  mean.push(`(${variants.join(" ")})`);
               }
               if (sense.def) mean.push(sense.def);
               if (sense.xrefs) mean.push(` (${sense.xrefs.join()})`);
               means.push({ def: mean.join() });
            }
            entry.meanings![pos] = means;
         }
      }
   }
   const nameRegex = new RegExp(`【名】|（人名）|（${word}）人名`, "i");
   // Collins Primary Dict
   if ((!entry.phonetic || !entry.sound) && root.collins_primary) {
      const cp = root.collins_primary;
      if (cp.words?.word === word && cp.gramcat?.length) {
         for (const gram of root.collins_primary.gramcat) {
            if (!entry.phonetic && gram.pronunciation)
               entry.phonetic = `/${gram.pronunciation}/`;
            if (!entry.sound && gram.audiourl) entry.sound = gram.audiourl;
         }
      }
   }
   // Simple Dict
   if ((!entry.phonetic || !entry.sound) && root.simple?.word?.length)
      for (const x of root.simple.word) {
         if (x["return-phrase"] !== word) continue;
         if (!entry.phonetic && x.usphone) entry.phonetic = `/${x.usphone}/`;
         if (!entry.sound && x.usspeech) entry.sound = x.usspeech;
      }
   // Collins Dict
   if (!entry.meanings && root.collins?.collins_entries?.length) {
      const collinsTran = new RegExp(`<b>${word}`, "i");
      const meanings: Record<string, Array<IMean>> = {};
      for (const x of root.collins.collins_entries) {
         if (x.entries?.entry?.length)
            for (const y of x.entries.entry) {
               if (y.tran_entry?.length)
                  for (const z of y.tran_entry) {
                     const pos = z.pos_entry?.pos;
                     if (
                        (z.headword && z.headword !== word) ||
                        pos?.toLowerCase().includes("phrase")
                     )
                        continue;
                     if (z.tran?.match(collinsTran)) {
                        const m = z.tran.match(collinsTail);
                        if (m) {
                           const item = { def: refine(m[1]) };
                           if (meanings[pos]) meanings[pos].push(item);
                           else meanings[pos] = [item];
                        }
                     }
                  }
            }
      }
      if (Object.keys(meanings).length) entry.meanings = meanings;
   }
   // Individual Dict
   if (!entry.meanings && root.individual?.trs?.length) {
      const meanings: Record<string, Array<IMean>> = {};
      for (const x of root.individual.trs) {
         const item = { trans: refine(x.tran) };
         if (meanings[x.pos]) meanings[x.pos].push(item);
         else meanings[x.pos] = [item];
      }
      if (Object.keys(meanings).length) entry.meanings = meanings;
   }
   // English-Chinese Dict
   if (root.ec?.word?.length) {
      const means: Array<IMean> = [];
      for (const x of root.ec.word) {
         if (!entry.phonetic && x.usphone) entry.phonetic = `/${x.usphone}/`;
         if (!entry.sound && x.usspeech) entry.sound = x.usspeech;
         if (x.trs?.length)
            for (const y of x.trs) {
               if (y.tr?.length)
                  for (const z of y.tr) {
                     if (z.l?.i?.length)
                        for (const w of z.l.i) {
                           if (w.match(nameRegex)) continue;
                           means.push({ trans: refine(w) });
                        }
                  }
            }
      }
      if (!entry.meanings) entry.meanings = { ecdict: means };
      else entry.meanings = { ecdict: means, ...entry.meanings };
   }
   return dict;
};
