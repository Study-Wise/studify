import mistakeenTrailingWhitespaceIssues from '../mistaken-trailing-whitespace-issues.json' with { type: 'json' };

function isMistakenTrailingWhitespaceIssue(filepath, line, column) {
    return mistakeenTrailingWhitespaceIssues.some(issue =>
        filepath.replace(/\\/g, '/').includes(issue.filepath) && issue.line === line && issue.column === column
    );
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Indentation, trailing whitespace, and newline standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                const code = context.sourceCode.getText();

                // Check 1: 4-space indentation (disallow tabs and 2-space indents)
                code.split(/\r?\n/).forEach((line, i) => {
                    if (line && line.match(/^\s/)) {
                        const match = line.match(/^(\s+)/);
                        if (match) {
                            if (match[1].includes('\t')) {
                                context.report({
                                    loc: {
                                        line: i + 1,
                                        column: 1
                                    },
                                    message: 'Indentation must use 4 spaces, not tabs'
                                });
                                return;
                            }

                            if (match[1].length % 4 !== 0 && match[1].length % 2 === 0) {
                                context.report({
                                    loc: {
                                        line: i + 1,
                                        column: 1
                                    },
                                    message: `Indentation must use 4-space increments, not 2-space. Found ${match[1].length} spaces.`
                                });
                                return;
                            }
                        }
                    }
                    if (/[ \t]+$/.test(line) && !isMistakenTrailingWhitespaceIssue(context.filename, i + 1, line.length - line.trimEnd().length + 1)) {
                        context.report({
                            loc: {
                                line: i + 1,
                                column: line.length - line.trimEnd().length + 1
                            },
                            message: 'Found trailing whitespace. Remove spaces or tabs at the end of lines.',
                            fix(fixer) {
                                const fixedCode = code.replace(/[ \t]+$/gm, '');
                                return fixer.replaceText(node, fixedCode);
                            }
                        });
                    }
                });

                // Check 2: Excessive newlines (3 or more consecutive)
                const skipLines = 3;
                const codeAfterFrontmatter = code.replace(/(?:\r\n|\r|\n)+$/, '').split(/\r\n|\r|\n/).slice(skipLines).join('\n');

                if (/(?:\n){3,}/g.test(codeAfterFrontmatter)) {
                    context.report({
                        loc: {
                            line: skipLines + codeAfterFrontmatter.substring(0, codeAfterFrontmatter.search(/(?:\n){3,}/)).split('\n').length,
                            column: 0
                        },
                        message: 'Found 3+ consecutive newlines. Use at most 1 blank line (2 consecutive newlines).',
                        fix(fixer) {
                            return fixer.replaceText(node, code.replace(/(?:\r\n|\r|\n){3,}/g, '\n\n'));
                        }
                    });
                }
            }
        };
    }
};
