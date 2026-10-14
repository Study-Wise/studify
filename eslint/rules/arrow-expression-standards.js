function hasAwaitOrAsync(node) {
    if (!node) return false;
    if (node.type === 'AwaitExpression') return true;
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') return node.async || hasAwaitOrAsync(node.body);
    if (node.type === 'CallExpression') return hasAwaitOrAsync(node.callee);
    if (node.type === 'MemberExpression') return hasAwaitOrAsync(node.object) || hasAwaitOrAsync(node.property);
    if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') return hasAwaitOrAsync(node.left) || hasAwaitOrAsync(node.right);
    if (node.type === 'UnaryExpression') return hasAwaitOrAsync(node.argument);
    if (node.type === 'ConditionalExpression') return hasAwaitOrAsync(node.test) || hasAwaitOrAsync(node.consequent) || hasAwaitOrAsync(node.alternate);
    if (node.type === 'SequenceExpression') return node.expressions.some(expr => hasAwaitOrAsync(expr));
    return false;
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Arrow function and expression standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            ArrowFunctionExpression(node) {
                // Check 1: Arrow function definitions
                if ((!node.parent || !(node.parent.type === 'CallExpression' || node.parent.type === 'NewExpression') || !Array.isArray(node.parent.arguments) || !node.parent.arguments.includes(node)) && (!node.parent || node.parent.type !== 'CallExpression' || node.parent.callee !== node) && (!context.filename.includes('/pages/api/') || !node.parent || node.parent.type !== 'VariableDeclarator' || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(node.parent.id?.name)) && (!node.parent || node.parent.type !== 'Property' || node.parent.key.type !== 'Identifier' || node.parent.key.name !== 'execute') && (!node.parent || node.parent.type !== 'Property')) {
                    context.report({
                        node,
                        message: `Arrow function definition '${!node.parent ? 'anonymous' : node.parent.type === 'VariableDeclarator' && node.parent.id.type === 'Identifier' ? node.parent.id.name : node.parent.type === 'AssignmentExpression' && node.parent.left.type === 'Identifier' ? node.parent.left.name : node.parent.type === 'Property' && node.parent.key.type === 'Identifier' ? node.parent.key.name : 'anonymous'}' is not allowed. Use a regular function declaration instead.`,
                    });
                }

                // Check 2: Arrow function parameter parentheses (as-needed)
                if (!node.params[0] || node.params.length !== 1) return;
                if (node.params[0].type === 'RestElement') return;
                if (node.returnType?.typeAnnotation?.type === 'TSTypePredicate') return;

                if (!node.params[0].typeAnnotation) return;

                if (node.returnType && node.returnType.typeAnnotation) return;

                if (node.params[0].typeAnnotation) return;

                const openParen = context.sourceCode.getTokenBefore(node.params[0]);
                const closeParen = context.sourceCode.getTokenAfter(node.params[0]);
                if (!openParen && closeParen && openParen.value === '(' && closeParen.value === ')') return;

                context.report({
                    node,
                    message: 'Unexpected parentheses around single arrow function parameter',
                    fix(fixer) {
                        return fixer.replaceTextRange(
                            [openParen.range[0], closeParen.range[1]],
                            node.params[0].name
                        );
                    }
                });
            },
            ConditionalExpression(node) {
                // Check 3: Unnecessary parentheses around ternary condition test
                if (!node.test) return;

                const tokenBeforeTest = context.sourceCode.getTokenBefore(node.test);
                const tokenAfterTest = context.sourceCode.getTokenAfter(node.test);

                if (
                    tokenBeforeTest
                    && tokenAfterTest
                    && tokenBeforeTest.value === '('
                    && tokenAfterTest.value === ')'
                    && tokenBeforeTest.range[1] === node.test.range[0]
                    && tokenAfterTest.range[0] === node.test.range[1]
                ) {
                    if (!hasAwaitOrAsync(node.test) && !(node.test.type !== 'Identifier' && node.test.type !== 'Literal' && node.test.type !== 'TemplateLiteral' && node.test.type !== 'MemberExpression')) {
                        context.report({
                            node,
                            message: 'Unnecessary parentheses around simple ternary condition',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [tokenBeforeTest.range[0], tokenAfterTest.range[1]],
                                    context.sourceCode.getText(node.test)
                                );
                            }
                        });
                    }
                }
            }
        };
    }
};
