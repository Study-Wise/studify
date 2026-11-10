export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Forbid chained promise calls (.then().then().catch().finally()) in server-side files; use async/await instead',
            category: 'Best Practices'
        },
        fixable: null,
        schema: []
    },
    create(context) {
        if (!(context.filename.includes('/pages/api/') || context.filename.includes('/modules/') || context.filename.includes('/db/') || context.filename.includes('/scripts/'))) return {};

        return {
            CallExpression(node) {
                // Check if this is a .then, .catch, or .finally call
                if (node.callee.type !== 'MemberExpression') return;

                if (!['then', 'catch', 'finally'].includes(node.callee.property?.name)) return;

                // Check if the object being called on is itself a .then, .catch, or .finally call
                let current = node.callee.object;

                // Count consecutive chained promise methods
                let chainCount = 1;
                while (current && current.type === 'CallExpression' && current.callee?.type === 'MemberExpression') {
                    if (['then', 'catch', 'finally'].includes(current.callee.property?.name)) {
                        chainCount++;
                        current = current.callee.object;
                    }
                    else break;
                }

                // Flag chains with 2 or more promise methods
                if (chainCount >= 2) {
                    context.report({
                        node,
                        message: `Promise method chains (.then().catch().finally()) in server-side code found.`
                    });
                }
            }
        };
    }
};
