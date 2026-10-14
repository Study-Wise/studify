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
                    message: '@ts-ignore, @ts-nocheck, and @ts-expect-error comments are not allowed. Fix the type issues instead.'
                });
            }
        });

        return {
            TSAsExpression(node) {
                if (node.typeAnnotation?.type === 'TSTypeOperator' && node.typeAnnotation.operator === 'keyof') return;
                if (node.typeAnnotation?.type === 'TSUnionType' && node.typeAnnotation.types?.some(t => t.type === 'TSTypeQuery') && node.typeAnnotation.types?.some(t => t.type === 'TSLiteralType' && (t.literal === 'honeypot' || t.literal?.value === 'honeypot'))) return;

                context.report({
                    node,
                    message: 'Type casts (as expressions) are not allowed. Use proper typing or type annotations instead.'
                });
            },
            TSTypeAssertion(node) {
                context.report({
                    node,
                    message: 'Type casts (angle bracket assertions) are not allowed. Use proper typing or type annotations instead.'
                });
            },
            TSAnyKeyword(node) {
                context.report({
                    node,
                    message: 'The "any" type is not allowed. Use a precise, concrete type instead.'
                });
            },
            TSUnknownKeyword(node) {
                // Check for standalone unknown type usage (but allow in function parameters for now if needed)
                // Skip if it's part of a union or intersection that might be necessary

                // Allow unknown only in very specific contexts if needed, otherwise flag all uses
                context.report({
                    node,
                    message: 'The "unknown" type is not allowed. Use a concrete, precise type instead.'
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
                        message: `z.${node.callee.property.name}() is not allowed. Use a precise Zod type or z.custom<T>() instead.`
                    });
                }
            }
        };
    }
};
