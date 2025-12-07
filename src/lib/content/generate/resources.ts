import { generateText } from 'ai';
import { getMessages } from '../../threads';
import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_SEARCH_API_KEY);

export async function generateResources(threadId: string, userEmail: string | null) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    const category = thread.category;
    const mode = thread.mode;

    // Get conversation history
    const messages = await getMessages(threadId, userEmail);

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Create a prompt to identify key topics and search queries
    const topicExtractionPrompt = `Based on the following conversation, extract 3-5 key topics or search queries that would help find relevant educational resources (videos, articles, tutorials, documentation).

For each topic, provide a concise search query that would work well for finding educational content.

Output format (JSON):
{
    "queries": [
        "topic 1 search query",
        "topic 2 search query",
        "topic 3 search query"
    ]
}

Only output the JSON, nothing else.`;

    // Build messages for topic extraction
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForTopicExtraction = [
        {
            role: 'system' as const,
            content: topicExtractionPrompt
        },
        ...conversationMessages
    ];

    // Extract topics using AI
    const topicResult = await generateText({
        model: 'openai/gpt-4.1-mini',
        messages: messagesForTopicExtraction,
        temperature: 0.5,
    });

    // Parse the JSON response
    let queries: string[] = [];
    try {
        const parsed = JSON.parse(topicResult.text);
        queries = parsed.queries || [];
    } catch (error) {
        console.error('Error parsing topic extraction response:', error);
        // Fallback: create a generic query based on category and mode
        queries = [`${mode} ${category} tutorial`];
    }

    // Search for resources using each query
    const allResources: any[] = [];

    for (const query of queries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
        try {
            const searchResult = await exa.searchAndContents(
                query,
                {
                    text: true,
                    numResults: 5,
                    category: 'educational',
                    highlights: true,
                }
            );

            if (searchResult.results) {
                allResources.push(...searchResult.results);
            }
        } catch (error) {
            console.error(`Error searching for query "${query}":`, error);
        }
    }

    // Deduplicate resources by URL
    const uniqueResources = Array.from(
        new Map(allResources.map(item => [item.url, item])).values()
    );

    // Organize and format the resources
    const resourcesData = {
        category,
        mode,
        queries,
        resources: uniqueResources.map(resource => ({
            title: resource.title || 'Untitled',
            url: resource.url,
            snippet: resource.text || resource.snippet || '',
            highlights: resource.highlights || [],
            publishedDate: resource.publishedDate || null,
            author: resource.author || null,
        })),
        generatedAt: new Date().toISOString(),
    };

    return resourcesData;
}
