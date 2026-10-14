export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Import path standards: no bare "." or ".." imports',
            category: 'Best Practices'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (typeof node.source.value !== 'string') return;

                if (/(^|\/)\.\.?$/.test(node.source.value)) {
                    context.report({
                        node,
                        message: 'Importing from paths ending in "." or ".." is not allowed. Import from a concrete lib path instead.',
                    });
                }
            }
        };
    }
};
