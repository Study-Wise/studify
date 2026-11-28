import Exa from 'exa-js';
import { z } from 'zod';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateObject } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import findSimulations from '@/lib/phet';
import { parseThreadData } from '@/lib/threads';
import { VendorError } from '@/lib/user-errors';
import { saveContent } from '@/lib/content/latest';
import { buildUploadedFilesContext } from '@/lib/content/uploaded-files-context';

import { eq } from 'drizzle-orm';

const exa = new Exa(import.meta.env.EXA_SEARCH_API_KEY || process.env.EXA_SEARCH_API_KEY);

const SIMULATION_CATEGORIES = ['science'];
const SIMULATION_EXCLUDED_MODES = ['computer-science'];

const ANSWER_DUMP_DOMAINS = ['bartleby.com', 'brainly.com', 'studyx.com', 'askfilo.com', 'chegg.com', 'coursehero.com', 'numerade.com'];

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

    if (threads.length === 0) throw new Error('Thread not found');

    const messages = parseThreadData(threads[0].thread)?.messages ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const topicSummary = (await generateObject(
        `You decide what to search the web for to find educational resources (simulations, videos, articles, tutorials and documentation) that help a student with this conversation. Return one concise search topic: a short phrase of at most 12 words naming the concept or subject the student is studying. Do not return the student's exact homework question or any answer to it.${buildUploadedFilesContext(threads[0].uploadedFiles ?? [])}${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`,
        'Return ONLY the search topic.',
        messages,
        config.model,
        config.provider,
        z.object({ topic: z.string().describe('A short search phrase naming the concept the student is studying') }),
    )).topic;

    const resourceCollection: ResourceCollection = {
        topic: threads[0].title || 'Study Resources',
        simulations: [],
        videos: [],
        articles: [],
        tutorials: [],
        documentation: [],
        generatedAt: new Date().toISOString()
    };

    try {
        if (SIMULATION_CATEGORIES.includes(threads[0].category) && !SIMULATION_EXCLUDED_MODES.includes(threads[0].mode)) {
            const simulations = await findSimulations(topicSummary);
            resourceCollection.simulations = simulations.map<Resource>(simulation => ({
                title: simulation.title,
                url: simulation.pageUrl,
                snippet: simulation.description.slice(0, 200),
                type: 'simulation',
                source: new URL(simulation.pageUrl).hostname
            }));
        }

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
