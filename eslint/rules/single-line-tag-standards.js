import { parse } from '@astrojs/compiler/sync';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Markup tag line splitting standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program() {
                if (!context.filename.endsWith('.astro')) return;

                // Tags and attributes come from the Astro compiler's AST, so only real tags and real attributes are counted. JSON.stringify visits every AST node, and the compiler reports byte offsets, which are converted to string indexes
                const bytes = Buffer.from(context.sourceCode.getText());

                JSON.stringify(parse(context.sourceCode.getText(), { position: true }).ast, (_key, node) => {
                    if (!node?.attributes) return node;

                    const start = bytes.subarray(0, node.position.start.offset).toString().length;
                    const tag = context.sourceCode.getText().slice(start).match(/^<[a-zA-Z](?:[^<>{}"']|"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*>/)?.[0];

                    if (tag?.includes('\n') && !(node.type === 'component' && (node.attributes.filter(attribute => attribute.kind === 'expression').length > 4 || (node.attributes.filter(attribute => attribute.kind === 'quoted').length <= 2 && node.attributes.filter(attribute => attribute.kind === 'expression' || attribute.kind === 'quoted').length > 4)))) {
                        context.report({
                            loc: context.sourceCode.getLocFromIndex(start),
                            message: 'Tag attributes split across lines found.',
                            fix(fixer) {
                                return fixer.replaceTextRange([start, start + tag.length], tag.replace(/\s*\r?\n\s*/g, ' ').replace(/ >$/, '>'));
                            }
                        });
                    }

                    return node;
                });
            }
        };
    }
};
