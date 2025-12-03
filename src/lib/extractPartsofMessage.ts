import { marked } from "marked";
import jsdom from 'jsdom';

async function extract(generatedText: string) {
    const obj = {
        studyGuide: '',
        referenceSheet: '',
    }

    const dom = new jsdom.JSDOM(generatedText);
    const document = dom.window.document;

    const fancyOutput = document.querySelector('.fancy-output');
    if (fancyOutput) {
        var studyGuide = document.querySelector('.study-guide')?.innerHTML || '';
        studyGuide = await marked.parse(studyGuide) || studyGuide;
        obj.studyGuide = studyGuide;

        var referenceSheet = document.querySelector('.reference-sheet')?.innerHTML || '';
        referenceSheet = await marked.parse(referenceSheet) || referenceSheet;
        obj.referenceSheet = referenceSheet;
    }

    // --- Markdown rendering ---
    let htmlText: string;
    try {
        marked.setOptions({ breaks: true, gfm: true });
        htmlText = await marked.parse(generatedText);
    } catch (error) {
        console.error('Error rendering markdown:', error);
        htmlText = generatedText; // Fallback to plain text
    }

    return { obj, generatedText: htmlText };
}

export default extract;