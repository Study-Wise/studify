function checkSingleDeclarationBlock(node, blockNode, context) {
    if (!blockNode || blockNode.type !== 'BlockStatement' || blockNode.body.length !== 1) return;

    if (!blockNode.body[0].loc?.start?.line || !blockNode.body[0].loc?.end?.line || blockNode.body[0].loc?.start?.line !== blockNode.body[0].loc?.end?.line) {
        return;
    }

    if (!node.loc?.start?.line || !blockNode.loc?.start?.line || node.loc?.start?.line !== blockNode.loc?.start?.line) {
        return;
    }

    const condensedLine = `${node === blockNode ? 'else' : context.sourceCode.text.slice(node.range[0], blockNode.range[0]).trim()} ${context.sourceCode.getText(blockNode.body[0]).trim()}`;
    if (condensedLine.length >= 100) return;

    context.report({
        node,
        message: 'Single statement in block should be on the same line as its condition with no curly braces (e.g. "if (x) return y;',
        fix(fixer) {
            const beforeBrace = context.sourceCode.text[context.sourceCode.getFirstToken(blockNode).range[0] - 1];
            return fixer.replaceTextRange(
                [context.sourceCode.getFirstToken(blockNode).range[0], context.sourceCode.getLastToken(blockNode).range[1]],
                `${beforeBrace !== ' ' && beforeBrace !== '\t' && beforeBrace !== '\n' ? ' ' : ''}${context.sourceCode.getText(blockNode.body[0]).trim()}`
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
                        message: 'Single-statement if block should not use curly braces',
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
                    message: 'Single statement in block should be condensed onto one line with no block',
                    fix(fixer) {
                        return fixer.replaceTextRange([node.body.range[0], node.body.range[1]], replacement);
                    }
                });
            }
        };
    }
};
