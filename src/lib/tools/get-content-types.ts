import { tool } from 'ai';
import { z } from 'zod';

import getContentTypes from '../get-content-types';

const searchTool = tool({
    description: 'Get a list of content generation types supported by the system',
    inputSchema: z.object({}),
    execute: async ({  }) => {
        return getContentTypes();
    },
});

export default {
    ...searchTool,
    ready: true,
};
