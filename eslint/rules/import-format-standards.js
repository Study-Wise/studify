export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Import format standards: separate mixed type and value imports, and no bare "." or ".." imports',
            category: 'Best Practices'
        },
        fixable: 'code',
        schema: [{
            type: 'object',
            properties: {
                lineLength: {
                    type: 'number',
                    default: 100
                }
            }
        }]
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                // Check 1: Mixed type and value imports on a long line
                if (
                    node.specifiers.some(spec => spec.importKind === 'type') &&
                    node.specifiers.some(spec => spec.importKind !== 'type') &&
                    context.sourceCode.getLines()[node.loc.start.line - 1]?.length > (context.options[0]?.lineLength || 100)
                ) {
                    context.report({
                        node,
                        message: `Mixed type and value imports on a long import line (${context.sourceCode.getLines()[node.loc.start.line - 1].length} chars) found.`
                    });
                }

                // Check 2: Imports from paths ending in "." or ".."
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
