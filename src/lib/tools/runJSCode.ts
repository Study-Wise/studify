import type { Tool } from '../types';

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

const tool: Tool = {
    name: 'runJSCode',
    description: 'Run JavaScript code',
    parameters: {
        type: 'object',
        properties: {
            code: { type: 'string', description: 'The JavaScript code to run' },
        },
    },
    execute: async (params: any) => {
        const code = params.code;

        let ranCode = (code.includes('\n') ? code.split('\n') : [code])
            .map((line: string) => (
                line.includes(';') ? line.split(';') : [line]
            ))
            .flat()
            .map((line: string) => (line.trim()))
            .map((line: string) => (
                lineReplacements
                    .map(replacement => (
                        (line[replacement.func as keyof string] as Function)(replacement.key)
                    ))
                    .filter((replaced: boolean) => replaced).length < 1 ? line : null
            ))
            .filter((line: string | null) => line)
            .join(';')

        const codeResult = await eval(ranCode);

        const result = {
            codeResult,
            ranCode,
        }

        return { message: 'JavaScript code executed', result };
    },
}

export default tool;