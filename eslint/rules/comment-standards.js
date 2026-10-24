export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Comment standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                // Check 1: Multi-line block comments
                const comments = context.sourceCode.getAllComments?.() || context.sourceCode.getComments?.() || [];
                const jsDocTags = /@(param|returns?|example|deprecated|throws?|see|author|version|since|async|yields?|access|readonly|private|protected|static|abstract|type|enum|callback|template|typedef|implements|interface|extends|class|function|const|var|let|ignore|preserve|preserve-indent|pre|code|literal|external|link)/;

                comments.forEach(comment => {
                    if (/(eslint-disable|eslint-enable|eslint-ignore|stylelint-disable|stylelint-enable|@ts-ignore|@ts-nocheck|@ts-expect-error)/.test(comment.value)) {
                        context.report({
                            node: node,
                            loc: comment.loc,
                            message: 'eslint comments are not allowed. Follow the code standards instead.'
                        });
                        return;
                    }

                    if (comment.type !== 'Block') return;

                    if (comment.loc.start.line === comment.loc.end.line) return;

                    if (jsDocTags.test(comment.value)) return;

                    const lines = comment.value.split('\n').map(line => line.trim());

                    while (lines.length > 0 && lines[0] === '') lines.shift();
                    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

                    const cleanedLines = lines.map(line => line.replace(/^\*\s?/, '').trim());

                    if (cleanedLines.filter(line => line.length > 0).length > 1) return;

                    context.report({
                        node: node,
                        loc: comment.loc,
                        message: 'Multi-line block comments should use single-line comment syntax (//) instead',
                        fix(fixer) {
                            return fixer.replaceText(comment, `// ${cleanedLines.join(' ').trim()}`);
                        }
                    });
                });

                // Check 2: Duplicate consecutive comments
                for (let i = 0; i < comments.length - 1; i++) {
                    if (context.sourceCode.getText().substring(comments[i].range[1], comments[i + 1].range[0]).trim() === '') {
                        if (comments[i].value === comments[i + 1].value) {
                            context.report({
                                node: node,
                                loc: comments[i + 1].loc,
                                message: 'Duplicate consecutive comment. Remove the redundant comment.',
                            });
                        }
                    }
                }

                // Check 3: Hard line breaks in single-line comments. A comment must not wrap across several // lines. Adjacent lines count as one wrapped-up comment, unless the first one ends a sentence or introduces a list (.!? :), which makes them separate comments
                const TERMINATOR = /[.!?:]$/;
                const CODE_LIKE = /^(?:console\.\w+\(|await\b|return\b|const\b|let\b|var\b|function\b|import\b|export\b)|[;{}]$|=>|^[\w$.]+\s*:\s*.+,\s*$/;

                for (let i = 0; i < comments.length - 1; i++) {
                    if (comments[i].type !== 'Line' || comments[i + 1].type !== 'Line') continue;
                    if (comments[i + 1].loc.start.line !== comments[i].loc.start.line + 1) continue;
                    if ([comments[i], comments[i + 1]].some(c => context.sourceCode.lines[c.loc.start.line - 1].slice(0, c.loc.start.column).trim() !== '')) continue;

                    if (CODE_LIKE.test(comments[i].value.trim()) || CODE_LIKE.test(comments[i + 1].value.trim())) continue;
                    if (TERMINATOR.test(comments[i].value.trim())) continue;
                    if (!comments[i].value.trim().endsWith(',') && !/^[a-z]/.test(comments[i + 1].value.trim())) continue;

                    context.report({
                        node: node,
                        loc: comments[i + 1].loc,
                        message: 'Hard line breaks are not allowed in single-line comments.',
                        fix(fixer) {
                            return fixer.replaceTextRange([comments[i].range[0], comments[i + 1].range[1]], `// ${comments[i].value.trim()} ${comments[i + 1].value.trim()}`);
                        }
                    });
                }
            }
        };
    }
};
