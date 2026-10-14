import tsParser from '@typescript-eslint/parser';

// Parser for .astro files that extracts and parses TypeScript frontmatter
export default function parse(code) {
    const match = code.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = match ? match[1] : code;

    try {
        const result = tsParser.parseForESLint(frontmatter, {
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
