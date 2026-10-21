import Exa from 'exa-js';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import findSimulations from '@/lib/phet';
import { parseThreadData } from '@/lib/threads';
import { VendorError } from '@/lib/user-errors';
import { saveContent } from '@/lib/content/latest';

import { eq } from 'drizzle-orm';

const exa = new Exa(import.meta.env.EXA_SEARCH_API_KEY || process.env.EXA_SEARCH_API_KEY);

// Categories that get PhET simulations, and modes within them that PhET doesn't cover
const SIMULATION_CATEGORIES = ['science'];
const SIMULATION_EXCLUDED_MODES = ['computer-science'];

// Sites that hand over the exact homework answer, which conflicts with the "no direct answers" policy
const ANSWER_DUMP_DOMAINS = ['bartleby.com', 'brainly.com', 'studyx.com', 'askfilo.com', 'chegg.com', 'coursehero.com', 'numerade.com'];

// Domains each search leaves out or is limited to
const EXCLUDED_DOMAINS = ['youtube.com', 'youtu.be', ...ANSWER_DUMP_DOMAINS];
const DOCUMENTATION_DOMAINS = ['wikipedia.org', 'docs.python.org', 'developer.mozilla.org', 'mathworld.wolfram.com', 'britannica.com', 'scholar.google.com', 'openstax.org', 'ocw.mit.edu'];

export interface Resource {
    title: string;
    url: string;
    snippet: string;
    type: 'simulation' | 'video' | 'article' | 'tutorial' | 'documentation';
    source: string;
}

interface ResourceCollection {
    topic: string;
    simulations: Resource[];
    videos: Resource[];
    articles: Resource[];
    tutorials: Resource[];
    documentation: Resource[];
    generatedAt: string;
}

export async function generateResources(threadId: string, userPrompt?: string): Promise<string> {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];

    const threadData = parseThreadData(thread.thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = thread.uploadedFiles ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    const conversationText = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');

    const uploadedFilesText = uploadedFiles
        .filter(f => f.extractedText)
        .map(f => f.extractedText)
        .join(' ');

    const combinedText = `${conversationText} ${uploadedFilesText}`.trim();
    let topicSummary = combinedText.slice(0, 500);
    if (userPrompt) topicSummary += ` ${userPrompt}`;

    const resourceCollection: ResourceCollection = {
        topic: thread.title || 'Study Resources',
        simulations: [],
        videos: [],
        articles: [],
        tutorials: [],
        documentation: [],
        generatedAt: new Date().toISOString()
    };

    try {
        // Science threads also get interactive PhET simulations
        if (SIMULATION_CATEGORIES.includes(thread.category) && !SIMULATION_EXCLUDED_MODES.includes(thread.mode)) {
            const simulations = await findSimulations(topicSummary);
            resourceCollection.simulations = simulations.map<Resource>(simulation => ({
                title: simulation.title,
                url: simulation.pageUrl,
                snippet: simulation.description.slice(0, 200),
                type: 'simulation',
                source: new URL(simulation.pageUrl).hostname
            }));
        }

        // Search for YouTube educational videos
        const videoResults = await exa.searchAndContents(
            `${topicSummary} educational video tutorial explanation`,
            {
                text: true,
                numResults: 8,
                includeDomains: ['youtube.com', 'youtu.be', 'khanacademy.org', 'coursera.org', 'edx.org', 'udemy.com', 'skillshare.com']
            }
        );

        resourceCollection.videos = videoResults.results.map<Resource>(result => ({
            title: result.title || 'Untitled Video',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'video',
            source: new URL(result.url).hostname
        }));

        // Search for articles and explanations
        const articleResults = await exa.searchAndContents(
            `${topicSummary} explanation guide article`,
            {
                text: true,
                numResults: 8,
                excludeDomains: EXCLUDED_DOMAINS
            }
        );

        resourceCollection.articles = articleResults.results.map<Resource>(result => ({
            title: result.title || 'Untitled Article',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'article',
            source: new URL(result.url).hostname
        }));

        // Search for tutorials and step-by-step guides
        const tutorialResults = await exa.searchAndContents(
            `${topicSummary} tutorial step by step how to`,
            {
                text: true,
                numResults: 8,
                excludeDomains: EXCLUDED_DOMAINS
            }
        );

        resourceCollection.tutorials = tutorialResults.results.map<Resource>(result => ({
            title: result.title || 'Untitled Tutorial',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'tutorial',
            source: new URL(result.url).hostname
        }));

        // Search for official documentation and reference materials
        const docResults = await exa.searchAndContents(
            `${topicSummary} documentation reference official`,
            {
                text: true,
                numResults: 6,
                includeDomains: DOCUMENTATION_DOMAINS
            }
        );

        resourceCollection.documentation = docResults.results.map<Resource>(result => ({
            title: result.title || 'Untitled Documentation',
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            type: 'documentation',
            source: new URL(result.url).hostname
        }));

    } catch (error) {
        console.error('Error searching for resources:', error);
        throw new VendorError('Exa', 'Failed to search for educational resources', { cause: error });
    }

    // Use https, and drop links already listed in an earlier section. URLs are compared ignoring protocol, "www.", case and trailing slashes.
    const seenUrls = new Set<string>();
    const sections: (keyof Pick<ResourceCollection, 'simulations' | 'videos' | 'articles' | 'tutorials' | 'documentation'>)[] = ['simulations', 'videos', 'articles', 'tutorials', 'documentation'];
    for (const section of sections) {
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

    await saveContent(threadId, 'additional-resources', content);

    return content;
}
