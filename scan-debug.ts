import { db } from './src/db/initialize';
import { threadsTable } from './src/db/schema';
import type { ThreadData } from './src/lib/threads';
import { eq } from 'drizzle-orm';

async function scanDebugMessages() {
    try {
        const result = await db
            .select({ thread: threadsTable.thread })
            .from(threadsTable)
            .where(eq(threadsTable.id, '5CIR9419K1svUmvDSPPPj'));

        if (result.length === 0) {
            console.log('Thread not found');
            return;
        }

        const threadData = result[0].thread as ThreadData;
        const debugIndices: number[] = [];
        
        for (let i = 0; i < threadData.messages.length; i++) {
            const msg = threadData.messages[i];
            const content = msg.content.toLowerCase();
            
            // Check for debug-related messages
            if (
                content.includes('did you call') ||
                content.includes('exact error') ||
                content.includes('what error') ||
                (msg.role === 'user' && content.includes('?') && 
                 (content.includes('error') || content.includes('what happened')))
            ) {
                debugIndices.push(i);
                continue;
            }
            
            // Check for tool call instructions followed by failures
            if (msg.role === 'user' && (content.includes('call') || content.includes('generate-content'))) {
                if (i + 1 < threadData.messages.length) {
                    const nextMsg = threadData.messages[i + 1];
                    const nextContent = nextMsg.content.toLowerCase();
                    
                    if (nextMsg.role === 'assistant' && (
                        nextContent.includes('nope') ||
                        nextContent.includes('unable') ||
                        nextContent.includes('error') ||
                        nextContent.includes('fail') ||
                        nextContent.includes('sorry') ||
                        nextContent.includes('apologize')
                    )) {
                        debugIndices.push(i);
                    }
                }
            }
        }
        
        if (debugIndices.length === 0) {
            console.log('No debug-related messages found in entire thread');
        } else {
            console.log(`Found ${debugIndices.length} debug-related messages at indices:`, debugIndices);
            console.log('\nDebug messages:');
            debugIndices.forEach(idx => {
                const msg = threadData.messages[idx];
                const preview = msg.content.substring(0, 80).replace(/\n/g, ' ');
                console.log(`[${idx}] ${msg.role}: ${preview}...`);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

scanDebugMessages();
