import { now } from "@sholvoir/memword-common/common";
import type { IDict, IEntry, IMean } from "@sholvoir/memword-common/idict";

const baseUrl = "https://dict.micinfotech.com/?q=";

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
            if (element.variants) webtop.push(element.variants.join());
            for (const sense of element.senses) {
               const mean = [];
               if (sense.def) mean.push(sense.def);
               if (sense.xrefs) mean.push(` (${sense.xrefs.join()})`);
               means.push({ def: mean.join() });
            }
            entry.meanings![pos] = means;
         }
      }
   }
   return dict;
};
