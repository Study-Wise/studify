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

                // Opening tags must not split their attributes across lines. A ">" inside quotes or braces does not end a tag. Frontmatter, script and style contents are blanked out so only markup is checked
                for (const match of context.sourceCode.getText().replace(/^---\r?\n[\s\S]*?\r?\n---|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, text => text.replace(/[^\r\n]/g, ' ')).matchAll(/<[a-zA-Z](?:[^<>{}"']|"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*>/g)) {
                    if (!match[0].includes('\n')) continue;

                    context.report({
                        loc: context.sourceCode.getLocFromIndex(match.index),
                        message: 'Tags must be on a single line. Do not split attributes across lines.',
                        fix(fixer) {
                            return fixer.replaceTextRange([match.index, match.index + match[0].length], match[0].replace(/\s*\r?\n\s*/g, ' ').replace(/ >$/, '>'));
                        }
                    });
                }
            }
        };
    }
};
