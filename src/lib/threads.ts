import { utapi } from './uploadthing';

async function getMessages(token: string) {
    try {
        const allFiles = await utapi.listFiles();
        const file = allFiles.files.find(f => f.name === `${token}.json`);
        const url = file ? `https://r72a1v4gs7.ufs.sh/f/${file.key}` : '';
        if (url) {
            const resp = await fetch(url);
            const data = await resp.json();
            return data.thread.messages;
        }
        else return []
    }
    catch (e) {
        console.error(e);
        return []
    }
}

export { getMessages };