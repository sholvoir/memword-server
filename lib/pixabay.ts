import { IDict } from "@sholvoir/memword-common/idict";

const baseUrl = 'https://pixabay.com/api/';
const key = Deno.env.get('PIXABAY_KEY');

const fillPic = async (dict: IDict): Promise<void> => {
    const resp = await fetch(`${baseUrl}?key=${key}&q=${encodeURIComponent(dict.word)}&orientation=vertical&safesearch=1`);
    if (!resp.ok) return;
    const content = await resp.json();
    if (!content.hits?.length) return;
    const random = Math.floor(Math.random() * content.hits.length)
    content.hits[random].previewURL.replace('_150.', '_1280.');
}

export default fillPic;

if (import.meta.main) {
    const dict = {word: Deno.args[0],version:0};
    await fillPic(dict)
    console.log(dict);
}