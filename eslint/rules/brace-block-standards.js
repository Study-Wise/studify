function checkSingleDeclarationBlock(node, blockNode, context) {
    if (!blockNode || blockNode.type !== 'BlockStatement' || blockNode.body.length !== 1) return;

    if (!blockNode.body[0].loc?.start?.line || !blockNode.body[0].loc?.end?.line || blockNode.body[0].loc?.start?.line !== blockNode.body[0].loc?.end?.line) {
        return;
    }

    if (!node.loc?.start?.line || !blockNode.loc?.start?.line || node.loc?.start?.line !== blockNode.loc?.start?.line) {
        return;
    }

    if (`${node === blockNode ? 'else' : context.sourceCode.text.slice(node.range[0], blockNode.range[0]).trim()} ${context.sourceCode.getText(blockNode.body[0]).trim()}`.length >= 100) return;

    context.report({
        node,
        message: 'Single statement in a block found',
        fix(fixer) {
            return fixer.replaceTextRange(
                [context.sourceCode.getFirstToken(blockNode).range[0], context.sourceCode.getLastToken(blockNode).range[1]],
                `${context.sourceCode.text[context.sourceCode.getFirstToken(blockNode).range[0] - 1] !== ' ' && context.sourceCode.text[context.sourceCode.getFirstToken(blockNode).range[0] - 1] !== '\t' && context.sourceCode.text[context.sourceCode.getFirstToken(blockNode).range[0] - 1] !== '\n' ? ' ' : ''}${context.sourceCode.getText(blockNode.body[0]).trim()}`
            );
        }
    });
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Brace placement and block statement standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                if (
                    !context.filename.endsWith('.astro') ||
                    node.body.length > 0
                ) return;

                const frontmatter = context.sourceCode.text.match(/^---\r?\n[\s\S]*?\r?\n---/);
                if (!frontmatter) return;

                for (const match of frontmatter[0].matchAll(
                    /\bif\s*\(([^()\r\n]*(?:\([^()\r\n]*\)[^()\r\n]*)*)\)\s*\{\s*([^;{}\r\n]*;)\s*\}/g
                )) {
                    context.report({
                        node,
                        loc: {
                            start: context.sourceCode.getLocFromIndex(match.index),
                            end: context.sourceCode.getLocFromIndex(match.index + match[0].length)
                        },
                        message: 'Curly braces around a single-statement if block found',
                        fix(fixer) {
                            return fixer.replaceTextRange(
                                [match.index, match.index + match[0].length],
                                `if (${match[1]}) ${match[2]}`
                            );
                        }
                    });
                }
            },
            IfStatement(node) {
                // Check 1: If/else brace placement
                if (node.alternate) {
                    if (context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.consequent))?.value === 'else' && context.sourceCode.getLastToken(node.consequent).loc.end.line === context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.consequent)).loc.start.line) {
                        context.report({
                            node: context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.consequent)),
                            message: 'Closing curly brace on the same line as the subsequent else block found',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.consequent).range[1], context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.consequent)).range[0]],
                                    '\n'
                                );
                            }
                        });
                    }
                }

                // Check 3: Single statement in if/else should be on one line
                checkSingleDeclarationBlock(node, node.consequent, context);
                if (node.alternate && node.alternate.type !== 'IfStatement') {
                    checkSingleDeclarationBlock(node.alternate, node.alternate, context);
                }
            },
            TryStatement(node) {
                // Check 2: Try/catch/finally must stay on same line
                if (node.handler) {
                    if (context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block))?.value === 'catch' && context.sourceCode.getLastToken(node.block).loc.end.line !== context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block)).loc.start.line) {
                        context.report({
                            node: context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block)),
                            message: 'Catch block on a different line from the closing brace found',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.block).range[1], context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block)).range[0]],
                                    ' '
                                );
                            }
                        });
                    }

                    if (node.finalizer) {
                        if (context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.handler.body))?.value === 'finally' && context.sourceCode.getLastToken(node.handler.body).loc.end.line !== context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.handler.body)).loc.start.line) {
                            context.report({
                                node: context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.handler.body)),
                                message: 'Finally block on a different line from the closing brace found',
                                fix(fixer) {
                                    return fixer.replaceTextRange(
                                        [context.sourceCode.getLastToken(node.handler.body).range[1], context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.handler.body)).range[0]],
                                        ' '
                                    );
                                }
                            });
                        }
                    }
                }
                else if (node.finalizer) {
                    if (context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block))?.value === 'finally' && context.sourceCode.getLastToken(node.block).loc.end.line !== context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block)).loc.start.line) {
                        context.report({
                            node: context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block)),
                            message: 'Finally block on a different line from the closing brace found',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.block).range[1], context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block)).range[0]],
                                    ' '
                                );
                            }
                        });
                    }
                }
            },
            ForStatement(node) {
                checkSingleDeclarationBlock(node, node.body, context);
            },
            WhileStatement(node) {
                checkSingleDeclarationBlock(node, node.body, context);
            },
            ArrowFunctionExpression(node) {
                if (!node.body || node.body.type !== 'BlockStatement' || node.body.body.length !== 1) return;
                if (node.body.loc?.start?.line === node.body.loc?.end?.line) return;
                if (context.sourceCode.getCommentsInside(node.body).length > 0) return;
                if (!node.body.body[0].loc || node.body.body[0].loc.start.line !== node.body.body[0].loc.end.line) return;

                let replacement;
                if (node.body.body[0].type === 'ExpressionStatement') {
                    replacement = context.sourceCode.getText(node.body.body[0].expression);
                }
                else if (node.body.body[0].type === 'ReturnStatement' && node.body.body[0].argument) {
                    replacement = context.sourceCode.getText(node.body.body[0].argument);
                }
                else return;

                context.report({
                    node,
                    message: 'Block around a single statement found',
                    fix(fixer) {
                        return fixer.replaceTextRange([node.body.range[0], node.body.range[1]], replacement);
                    }
                });
            }
        };
    }
};
