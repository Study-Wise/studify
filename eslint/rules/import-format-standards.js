export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Import format standards: no bare "." or ".." imports',
            category: 'Best Practices'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (typeof node.source.value === 'string' && /(^|\/)\.\.?$/.test(node.source.value)) {
                    context.report({
                        node,
                        message: 'Import from a path ending in "." or ".." found.',
                    });
                }
            }
        };
    }
};
