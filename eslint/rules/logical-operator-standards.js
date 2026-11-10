export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Logical operator placement standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            LogicalExpression(node) {
                // Check 1: A logical operator ends its line instead of starting the next one
                const operatorToken = context.sourceCode.getFirstTokenBetween(node.left, node.right, token => token.value === node.operator);

                if (context.sourceCode.getTokenBefore(operatorToken).loc.end.line === operatorToken.loc.start.line || context.sourceCode.getCommentsInside(node).length > 0) return;

                context.report({
                    node: operatorToken,
                    message: 'Logical operator at the start of a line found',
                    fix(fixer) {
                        return fixer.replaceTextRange(
                            [context.sourceCode.getTokenBefore(operatorToken).range[1], context.sourceCode.getTokenAfter(operatorToken).range[0]],
                            ` ${node.operator}\n${context.sourceCode.lines[operatorToken.loc.start.line - 1].match(/^\s*/)[0]}`
                        );
                    }
                });
            }
        };
    }
};
