import { tool } from 'ai';
import { z } from 'zod';

const lineReplacements = [
    {
        func: 'startsWith',
        key: 'import ',
    },
    {
        func: 'includes',
        key: 'import('
    }
]

const runJSCodeTool = tool({
    description: 'Run JavaScript code',
    inputSchema: z.object({
        code: z.string().describe('The JavaScript code to run'),
    }),
    execute: async ({ code }) => {
        try {
            let ranCode = (code.includes('\n') ? code.split('\n') : [code])
                .map((line: string) => (
                    line.includes(';') ? line.split(';') : [line]
                ))
                .flat()
                .map((line: string) => (line.trim()))
                .map((line: string) => (
                    lineReplacements
                        .map(replacement => (
                            (line[replacement.func as keyof string] as (arg: string) => boolean)(replacement.key)
                        ))
                        .filter(Boolean).length < 1 ? line : null
                ))
                .filter((line: string | null) => line)

            const last = ranCode[ranCode.length - 1]
            if (last && !last.includes('return')) {
                ranCode[ranCode.length - 1] = 'return ' + last
            }
            const joinedCode = ranCode.join(';') || ''

            const codeResult = await Function(joinedCode)();

            return JSON.stringify({ codeResult, ranCode }, null, 2);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ error: true, message: `Code execution failed: ${errorMessage}` }, null, 2);
        }
    },
});

export default {
    ...runJSCodeTool,
    ready: true,
    label: 'Running JS code',
};
