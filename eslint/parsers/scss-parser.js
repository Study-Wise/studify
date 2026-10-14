// Minimal parser for .scss files that doesn't validate syntax that returns a basic Program node so ESLint can run custom text-based rules

export default function parse(code) {
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
            Program: ['body']
        },
        scopeManager: null
    };
}
