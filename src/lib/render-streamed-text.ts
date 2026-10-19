import { marked } from 'marked';

const closers: Record<string, string> = { '$$': '$$', '$': '$', '\\(': '\\)', '\\[': '\\]' };

// Drop a formula that is still being written, so half a formula never shows
function hideIncompleteMath(text: string): string {
    let open: RegExpMatchArray | undefined;
    for (const match of text.matchAll(/\$\$|\$|\\[()[\]]/g)) {
        if (!open && closers[match[0]]) open = match;
        else if (open && match[0] === closers[open[0]]) open = undefined;
    }
    return open ? text.slice(0, open.index) : text;
}

export async function renderStreamedText(text: string): Promise<string> {
    return marked.parse(hideIncompleteMath(text), { breaks: true, gfm: true });
}
