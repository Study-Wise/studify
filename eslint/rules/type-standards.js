export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Type safety: forbid any, all uses of unknown type, casts with unknown or never, and unsafe Zod operations',
            category: 'Best Practices'
        },
        schema: []
    },
    create(context) {
        const allComments = context.sourceCode.getAllComments?.() || context.sourceCode.getComments?.() || [];

        allComments.forEach(comment => {
            if (/@ts-(ignore|nocheck|expect-error)/.test(comment.value)) {
                context.report({
                    node: { type: 'Program' },
                    loc: comment.loc,
                    message: '@ts-ignore, @ts-nocheck, and @ts-expect-error comments found.'
                });
            }
        });

        return {
            TSAsExpression(node) {
                if (
                    context.filename.endsWith('.astro') &&
                    node.typeAnnotation?.type === 'TSTypeReference' &&
                    node.typeAnnotation.typeName?.type === 'Identifier' &&
                    ['HTMLElement', 'HTMLFormElement'].includes(node.typeAnnotation.typeName.name)
                ) return;
                if (node.typeAnnotation?.type === 'TSTypeOperator' && node.typeAnnotation.operator === 'keyof') return;
                if (node.typeAnnotation?.type === 'TSUnionType' && node.typeAnnotation.types?.some(t => t.type === 'TSTypeQuery') && node.typeAnnotation.types?.some(t => t.type === 'TSLiteralType' && (t.literal === 'honeypot' || t.literal?.value === 'honeypot'))) return;

                context.report({
                    node,
                    message: 'Type casts (as expressions) found.'
                });
            },
            TSTypeAssertion(node) {
                context.report({
                    node,
                    message: 'Type casts (angle bracket assertions) found.'
                });
            },
            TSAnyKeyword(node) {
                context.report({
                    node,
                    message: 'The "any" type found.'
                });
            },
            TSUnknownKeyword(node) {
                // Check for standalone unknown type usage (but allow in function parameters for now if needed)
                // Skip if it's part of a union or intersection that might be necessary

                // Allow unknown only in very specific contexts if needed, otherwise flag all uses
                context.report({
                    node,
                    message: 'The "unknown" type found.'
                });
            },
            CallExpression(node) {
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.type === 'Identifier' &&
                    node.callee.object.name === 'z' &&
                    node.callee.property.type === 'Identifier' &&
                    (node.callee.property.name === 'any' || node.callee.property.name === 'unknown')
                ) {
                    context.report({
                        node,
                        message: `z.${node.callee.property.name}() found.`
                    });
                }
            }
        };
    }
};
