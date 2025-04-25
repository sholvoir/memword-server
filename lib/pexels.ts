import { IDict } from "./idict.ts";

const baseUrl = 'https://api.pexels.com/v1/search';
const requestInit: RequestInit = { headers: new Headers({"Authorization": Deno.env.get('PEXELS_KEY')!}) };

const fillPic = async (dict: IDict): Promise<void> => {
    const resp = await fetch(`${baseUrl}?query=${encodeURIComponent(dict.word)}&orientation=portrait&per_page=80`, requestInit);
    if (!resp.ok) return;
    const content = await resp.json();
    if (!content.photos?.length) return;
    const random = Math.floor(Math.random() * content.photos.length)
    content.photos[random].src.portrait;
}

export default fillPic;

if (import.meta.main) {
    const dict = {word:Deno.args[0], version:0};
    await fillPic(dict);
    console.log(dict);
}