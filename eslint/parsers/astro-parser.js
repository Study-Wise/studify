import tsParser from '@typescript-eslint/parser';

// Parser for .astro files that extracts and parses frontmatter and script contents
export default function parse(code) {
    const parsedCode = code.split('').map(char => char === '\n' || char === '\r' ? char : ' ');
    const frontmatter = code.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (frontmatter) {
        for (let index = 0; index < frontmatter[1].length; index++) {
            parsedCode[frontmatter[0].indexOf(frontmatter[1]) + index] = frontmatter[1][index];
        }
    }

    for (const match of code.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
        for (let index = 0; index < match[1].length; index++) {
            parsedCode[match.index + match[0].indexOf(match[1]) + index] = match[1][index];
        }
    }

    try {
        const result = tsParser.parseForESLint(parsedCode.join(''), {
            ecmaVersion: 'latest',
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true
            }
        });

        // Create a new visitorKeys object with additional keys
        const visitorKeys = {
            ...result.visitorKeys,
            ImportDeclaration: ['specifiers', 'source'],
            ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
            ExportAllDeclaration: ['source']
        };

        return {
            ...result,
            visitorKeys
        };
    } catch {
        const lines = code.split('\n');
        return {
            ast: {
                type: 'Program',
                body: [],
                sourceType: 'module',
                range: [0, code.length],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: lines.length, column: lines[lines.length - 1].length }
                },
                tokens: [],
                comments: []
            },
            visitorKeys: {
                Program: ['body'],
                ImportDeclaration: ['specifiers', 'source'],
                ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
                ExportAllDeclaration: ['source']
            },
            scopeManager: null
        };
    }
}
