function checkSingleDeclarationBlock(node, blockNode, context) {
    if (!blockNode || blockNode.type !== 'BlockStatement' || blockNode.body.length !== 1) {
        return;
    }

    if (!blockNode.body[0].loc?.start?.line || !blockNode.body[0].loc?.end?.line || blockNode.body[0].loc?.start?.line !== blockNode.body[0].loc?.end?.line) {
        return;
    }

    if (!node.loc?.start?.line || !blockNode.loc?.start?.line || node.loc?.start?.line !== blockNode.loc?.start?.line) {
        return;
    }

    const condensedLine = `${context.sourceCode.getText(node).trim()} ${context.sourceCode.getText(blockNode.body[0]).trim()}`;
    if (condensedLine.length >= 100) return;

    const reportObj = {
        node,
        message: 'Single statement in block should be on one line'
    };

    if (!context.filename.endsWith('.astro')) {
        reportObj.fix = function(fixer) {
            const beforeBrace = context.sourceCode.text[context.sourceCode.getFirstToken(blockNode).range[0] - 1];
            const needsSpace = beforeBrace !== ' ' && beforeBrace !== '\t' && beforeBrace !== '\n';
            return fixer.replaceTextRange(
                [context.sourceCode.getFirstToken(blockNode).range[0], context.sourceCode.getLastToken(blockNode).range[1]],
                `${needsSpace ? ' ' : ''}${context.sourceCode.getText(blockNode.body[0]).trim()}`
            );
        };
    }

    context.report(reportObj);
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
            IfStatement(node) {
                // Check 1: If/else brace placement
                if (node.alternate) {
                    const elseToken = context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.consequent));

                    if (elseToken && elseToken.value === 'else' && context.sourceCode.getLastToken(node.consequent).loc.end.line === elseToken.loc.start.line) {
                        context.report({
                            node: elseToken,
                            message: 'Closing curly brace appears on the same line as the subsequent if else block',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.consequent).range[1], elseToken.range[0]],
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
                    const catchToken = context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block));

                    if (catchToken && catchToken.value === 'catch' && context.sourceCode.getLastToken(node.block).loc.end.line !== catchToken.loc.start.line) {
                        context.report({
                            node: catchToken,
                            message: 'catch block must be on the same line as closing brace: } catch',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.block).range[1], catchToken.range[0]],
                                    ' '
                                );
                            }
                        });
                    }

                    if (node.finalizer) {
                        const finallyToken = context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.handler.body));

                        if (finallyToken && finallyToken.value === 'finally' && context.sourceCode.getLastToken(node.handler.body).loc.end.line !== finallyToken.loc.start.line) {
                            context.report({
                                node: finallyToken,
                                message: 'finally block must be on the same line as closing brace: } finally',
                                fix(fixer) {
                                    return fixer.replaceTextRange(
                                        [context.sourceCode.getLastToken(node.handler.body).range[1], finallyToken.range[0]],
                                        ' '
                                    );
                                }
                            });
                        }
                    }
                }
                else if (node.finalizer) {
                    const finallyToken = context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block));

                    if (finallyToken && finallyToken.value === 'finally' && context.sourceCode.getLastToken(node.block).loc.end.line !== finallyToken.loc.start.line) {
                        context.report({
                            node: finallyToken,
                            message: 'finally block must be on the same line as closing brace: } finally',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.block).range[1], finallyToken.range[0]],
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
            }
        };
    }
};
