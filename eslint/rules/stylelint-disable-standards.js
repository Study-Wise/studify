export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Ban inline stylelint-disable and stylelint-enable comments; add exceptions to the overrides in .stylelintrc.json instead',
            category: 'Best Practices'
        },
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                if (!context.filename.endsWith('.scss')) return;

                for (const match of context.sourceCode.text.matchAll(/(?:\/\/|\/\*)[^\n]*?\bstylelint-(?:disable|enable)(?:-line|-next-line)?\b/g)) {
                    context.report({
                        node,
                        loc: {
                            start: context.sourceCode.getLocFromIndex(match.index),
                            end: context.sourceCode.getLocFromIndex(match.index + match[0].length)
                        },
                        message: 'Inline stylelint-disable and stylelint-enable comments are not allowed. Add the exception to the overrides in .stylelintrc.json instead.'
                    });
                }
            }
        };
    }
};
