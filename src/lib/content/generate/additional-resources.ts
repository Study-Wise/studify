import Exa from 'exa-js';

import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import type { ThreadData, UploadedFile } from '@/lib/threads';
import { saveContent } from '@/lib/content/latest';
import { VendorError } from '@/lib/user-errors';

const exa = new Exa(import.meta.env.EXA_SEARCH_API_KEY || process.env.EXA_SEARCH_API_KEY);

export interface Resource {
    title: string;
    url: string;
    snippet: string;
    type: 'video' | 'article' | 'tutorial' | 'documentation';
    source: string;
}

interface ResourceCollection {
    topic: string;
    videos: Resource[];
    articles: Resource[];
    tutorials: Resource[];
    documentation: Resource[];
    generatedAt: string;
}

export async function generateResources(threadId: string): Promise<string> {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];

    // Get conversation history directly from thread data
    const threadData = thread.thread as ThreadData;
    const messages = threadData?.messages ?? [];

    // Get uploaded files
    const uploadedFiles = (thread.uploadedFiles as UploadedFile[]) ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Extract the main topic from the conversation
    const conversationText = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');

    // Include extracted text from uploaded files in topic extraction
    const uploadedFilesText = uploadedFiles
        .filter(f => f.extractedText)
        .map(f => f.extractedText)
        .join(' ');

    // Create a concise topic summary for search (include uploaded files content)
    const combinedText = `${conversationText} ${uploadedFilesText}`.trim();
    const topicSummary = combinedText.slice(0, 500);

    const resourceCollection: ResourceCollection = {
        topic: thread.title || 'Study Resources',
        videos: [],
        articles: [],
        tutorials: [],
        documentation: [],
        generatedAt: new Date().toISOString()
    };

    try {
        // Search for YouTube educational videos
        const videoResults = await exa.searchAndContents(
            `${topicSummary} educational video tutorial explanation`,
            {
                text: true,
                numResults: 8,
                includeDomains: ['youtube.com', 'youtu.be', 'khanacademy.org', 'coursera.org', 'edx.org', 'udemy.com', 'skillshare.com']
            }
        );

        resourceCollection.videos = videoResults.results.map(result => ({
            title: result.title || 'Untitled Video',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'video' as const,
            source: new URL(result.url).hostname
        }));

        // Search for articles and explanations
        const articleResults = await exa.searchAndContents(
            `${topicSummary} explanation guide article`,
            {
                text: true,
                numResults: 8,
                excludeDomains: ['youtube.com', 'youtu.be']
            }
        );

        resourceCollection.articles = articleResults.results.map(result => ({
            title: result.title || 'Untitled Article',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'article' as const,
            source: new URL(result.url).hostname
        }));

        // Search for tutorials and step-by-step guides
        const tutorialResults = await exa.searchAndContents(
            `${topicSummary} tutorial step by step how to`,
            {
                text: true,
                numResults: 8,
                excludeDomains: ['youtube.com', 'youtu.be']
            }
        );

        resourceCollection.tutorials = tutorialResults.results.map(result => ({
            title: result.title || 'Untitled Tutorial',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'tutorial' as const,
            source: new URL(result.url).hostname
        }));

        // Search for official documentation and reference materials
        const docResults = await exa.searchAndContents(
            `${topicSummary} documentation reference official`,
            {
                text: true,
                numResults: 6,
                includeDomains: ['wikipedia.org', 'docs.python.org', 'developer.mozilla.org', 'mathworld.wolfram.com', 'britannica.com', 'scholar.google.com']
            }
        );

        resourceCollection.documentation = docResults.results.map(result => ({
            title: result.title || 'Untitled Documentation',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'documentation' as const,
            source: new URL(result.url).hostname
        }));

    } catch (error) {
        console.error('Error searching for resources:', error);
        throw new VendorError('Exa', 'Failed to search for educational resources', { cause: error });
    }

    // Use https, and drop links already listed in an earlier section. URLs are
    // compared ignoring protocol, "www.", case and trailing slashes.
    const seenUrls = new Set<string>();
    for (const section of ['videos', 'articles', 'tutorials', 'documentation'] as const) {
        resourceCollection[section] = resourceCollection[section].filter(resource => {
            const url = new URL(resource.url);
            url.protocol = 'https:';
            resource.url = url.toString();

            const key = `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '')}${url.search}`.toLowerCase();
            if (seenUrls.has(key)) return false;
            seenUrls.add(key);
            return true;
        });
    }

    const content = JSON.stringify(resourceCollection, null, 2);

    // Save to database
    await saveContent(threadId, 'additional-resources', content);

    return content;
}
