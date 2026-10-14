export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Import format standards: separate mixed type and value imports',
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
        const options = context.options[0] || {};
        const lineLength = options.lineLength || 100;

        return {
            Program(node) {
                if (!node.body) return;

                const importNodes = (node.body || []).filter(statement => statement && statement.type === 'ImportDeclaration');
                if (importNodes.length === 0) return;

                for (const importNode of importNodes) {
                    const fullLine = context.sourceCode.getLines()[importNode.loc.start.line - 1];
                    if (!fullLine) continue;

                    const hasMixedImports =
                        importNode.specifiers.some(spec => spec.importKind === 'type') &&
                        importNode.specifiers.some(spec => spec.importKind !== 'type');

                    if (hasMixedImports && fullLine.length > lineLength) {
                        context.report({
                            node: importNode,
                            message: `Long import line (${fullLine.length} chars) with mixed type and value imports. Separate them into two statements: \`import type { ... } from "..."\` and \`import { ... } from "..."\`.`
                        });
                    }
                }
            }
        };
    }
};
