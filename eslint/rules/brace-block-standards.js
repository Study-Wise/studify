function canOmitBlock(node, blockNode, context) {
    if (blockNode?.type !== 'BlockStatement' || blockNode.body.length !== 1) return false;
    if (!blockNode.body[0].loc?.start?.line || blockNode.body[0].loc.start.line !== blockNode.body[0].loc.end.line) return false;
    if (context.sourceCode.getTokenBefore(blockNode).loc.end.line !== blockNode.loc.start.line) return false;
    if (['ClassDeclaration', 'FunctionDeclaration', 'TryStatement'].includes(blockNode.body[0].type)) return false;
    if (blockNode.body[0].type === 'VariableDeclaration' && blockNode.body[0].kind !== 'var') return false;
    if (context.sourceCode.getCommentsInside(blockNode).length > 0) return false;
    if (node.type === 'IfStatement' && node.consequent === blockNode && node.alternate && blockNode.body[0].type === 'IfStatement' && !blockNode.body[0].alternate) return false;

    return true;
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
                    const elseToken = context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.consequent));

                    if (elseToken && elseToken.value === 'else' && context.sourceCode.getLastToken(node.consequent).loc.end.line === elseToken.loc.start.line) {
                        context.report({
                            node: elseToken,
                            message: 'Closing curly brace on the same line as the subsequent else block found',
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [context.sourceCode.getLastToken(node.consequent).range[1], elseToken.range[0]],
                                    '\n'
                                );
                            }
                        });
                    }
                }
            },
            'IfStatement, WhileStatement'(node) {
                // Check 5: A condition spanning several lines starts on its own line after "(" and closes on its own line before ")"
                if (node.test.loc.start.line === node.test.loc.end.line) return;

                const openParenEnd = context.sourceCode.getTokenBefore(node.test).range[1];
                const closeParenStart = context.sourceCode.getTokenAfter(node.test).range[0];

                if (context.sourceCode.getTokenBefore(node.test).loc.end.line !== node.test.loc.start.line && context.sourceCode.getTokenAfter(node.test).loc.start.line !== node.test.loc.end.line) return;

                context.report({
                    node,
                    message: 'Multi-line condition not on its own lines inside the parentheses found',
                    fix(fixer) {
                        const indentation = context.sourceCode.lines[node.loc.start.line - 1].match(/^\s*/)[0];
                        const lines = context.sourceCode.text.slice(openParenEnd, closeParenStart).trim().split(/\r?\n/).filter(line => line.trim());

                        return fixer.replaceTextRange(
                            [openParenEnd, closeParenStart],
                            `\n${indentation}    ${lines[0].trim()}${lines.slice(1).map(line => `\n${indentation}    ${' '.repeat(line.match(/^\s*/)[0].length - Math.min(...lines.slice(1).map(entry => entry.match(/^\s*/)[0].length)))}${line.trim()}`).join('')}\n${indentation}`
                        );
                    }
                });
            },
            'IfStatement, ForStatement, ForInStatement, ForOfStatement, WhileStatement'(node) {
                // Check 3: Single statement blocks and multi-line conditions in if/else and loops
                for (const [owner, body] of [[node, node.consequent ?? node.body], [node.alternate, node.alternate]]) {
                    if (!body || (owner !== node && body.type === 'IfStatement')) continue;

                    if (!canOmitBlock(owner, body, context)) continue;

                    context.report({
                        node: owner,
                        message: 'Single statement in a block found',
                        fix(fixer) {
                            const beforeBrace = context.sourceCode.text[context.sourceCode.getFirstToken(body).range[0] - 1];
                            return fixer.replaceTextRange(
                                [context.sourceCode.getFirstToken(body).range[0], context.sourceCode.getLastToken(body).range[1]],
                                `${beforeBrace !== ' ' && beforeBrace !== '\t' && beforeBrace !== '\n' ? ' ' : ''}${context.sourceCode.getText(body.body[0]).trim()}`
                            );
                        }
                    });
                }
            },
            TryStatement(node) {
                // Check 2: Try/catch/finally must stay on same line
                if (node.handler) {
                    const catchToken = context.sourceCode.getTokenAfter(context.sourceCode.getLastToken(node.block));

                    if (catchToken && catchToken.value === 'catch' && context.sourceCode.getLastToken(node.block).loc.end.line !== catchToken.loc.start.line) {
                        context.report({
                            node: catchToken,
                            message: 'Catch block on a different line from the closing brace found',
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
                                message: 'Finally block on a different line from the closing brace found',
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
                            message: 'Finally block on a different line from the closing brace found',
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
            BlockStatement(node) {
                // Check 4: Blocks that need their braces must not sit on a single line
                if (node.body.length === 0 || node.loc.start.line !== node.loc.end.line || context.sourceCode.getCommentsInside(node).length > 0) return;
                if (['IfStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement'].includes(node.parent.type) && canOmitBlock(node.parent.type === 'IfStatement' && node.parent.alternate === node ? node : node.parent, node, context)) return;
                if (node.parent.type === 'ArrowFunctionExpression' && node.body.length === 1 && (node.body[0].type === 'ExpressionStatement' || (node.body[0].type === 'ReturnStatement' && node.body[0].argument))) return;

                context.report({
                    node,
                    message: 'Single-line block with required braces found',
                    fix(fixer) {
                        const indentation = context.sourceCode.lines[node.loc.start.line - 1].match(/^\s*/)[0];

                        return fixer.replaceTextRange(
                            [node.range[0] + 1, node.range[1] - 1],
                            `\n${indentation}    ${node.body.map(statement => context.sourceCode.getText(statement)).join(`\n${indentation}    `)}\n${indentation}`
                        );
                    }
                });
            },
            ArrowFunctionExpression(node) {
                if (!node.body || node.body.type !== 'BlockStatement' || node.body.body.length !== 1) return;
                if (node.body.loc?.start?.line === node.body.loc?.end?.line) return;
                if (context.sourceCode.getCommentsInside(node.body).length > 0) return;
                if (!node.body.body[0].loc || node.body.body[0].loc.start.line !== node.body.body[0].loc.end.line) return;

                let replacement;
                if (node.body.body[0].type === 'ExpressionStatement') replacement = context.sourceCode.getText(node.body.body[0].expression);
                else if (node.body.body[0].type === 'ReturnStatement' && node.body.body[0].argument) replacement = context.sourceCode.getText(node.body.body[0].argument);
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
