import type { Tool } from '../types';

import Exa from "exa-js";
const exa = new Exa(process.env.EXA_SEARCH_API_KEY);


const tool: Tool = {
    name: 'search',
    description: 'Search the web for information',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'The query to search for' },
        },
    },
    execute: async (params: any) => {
        const query = params.query;

        const searchResult = await exa.getContents(
            [query],
            { text: true }
          );
          
        const result = {
            searchResult,
        }

        return { message: 'JavaScript code executed', result };
    },
}

export default tool;