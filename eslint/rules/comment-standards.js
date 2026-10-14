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

                    if (comment.loc.start.line === comment.loc.end.line) {
                        return;
                    }

                    if (jsDocTags.test(comment.value)) return;

                    const lines = comment.value.split('\n').map(line => line.trim());

                    while (lines.length > 0 && lines[0] === '') {
                        lines.shift();
                    }
                    while (lines.length > 0 && lines[lines.length - 1] === '') {
                        lines.pop();
                    }

                    const cleanedLines = lines.map(line => {
                        return line.replace(/^\*\s?/, '').trim();
                    });

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
            }
        };
    }
};
