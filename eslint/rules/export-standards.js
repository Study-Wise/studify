export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Export standards: no direct re-exports or wildcard re-exports',
            category: 'Best Practices'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            ExportNamedDeclaration(node) {
                if (node.source) {
                    context.report({
                        node,
                        message: `Direct re-export from "${node.source.value}" found.`
                    });
                }
            },
            ExportAllDeclaration(node) {
                context.report({
                    node,
                    message: `Direct re-export with \`export *\` from "${node.source.value}" found.`
                });
            }
        };
    }
};
