import findSimulations from '@/lib/phet';
import { tool } from 'ai';
import { z } from 'zod';

const findSimulationTool = tool({
    description: 'Find interactive PhET simulations for a physics, chemistry, math, biology or earth science topic. Returns the simulation page and a URL that can be embedded in an iframe so the student can change parameters and watch what happens.',
    inputSchema: z.object({
        topic: z.string().describe('The concept to find a simulation for, e.g. "projectile motion" or "gas laws"'),
    }),
    execute: async ({ topic }) => {
        try {
            const simulations = await findSimulations(topic);

            if (simulations.length === 0) {
                return JSON.stringify({ simulations, message: `No PhET simulations found for "${topic}".` }, null, 2);
            }

            return JSON.stringify({ simulations }, null, 2);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: true, message: `Simulation search failed for topic "${topic}": ${errorMessage}` }, null, 2);
        }
    },
});

export default {
    ...findSimulationTool,
    ready: true,
    label: 'Finding interactive simulations',
};
