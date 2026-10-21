const groupNames = {
    1: 'external package',
    2: '"../" path',
    3: '"./" path',
    4: '"sass:" module'
};

function getUseGroup(source) {
    if (source.startsWith('sass:')) return 4;
    if (source.startsWith('../')) return 2;
    if (source.startsWith('./')) return 3;
    return 1;
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'SCSS @use order standards: external packages, then ../ paths, then ./ paths, then sass: modules',
            category: 'Best Practices'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                if (!context.filename.endsWith('.scss')) return;

                const blocks = [];
                let currentBlock = null;
                let offset = 0;

                for (const line of context.sourceCode.text.split('\n')) {
                    const lineText = line.replace(/\r$/, '');
                    const lineMatch = lineText.match(/^@use\s+(['"])(.+?)\1[^;]*;[ \t]*$/);

                    if (lineMatch) {
                        if (!currentBlock) {
                            currentBlock = { start: offset, end: offset, lines: [] };
                            blocks.push(currentBlock);
                        }

                        currentBlock.lines.push({ text: lineText, group: getUseGroup(lineMatch[2]) });
                        currentBlock.end = offset + lineText.length;
                    }
                    else currentBlock = null;

                    offset += line.length + 1;
                }

                let highestGroup = 0;

                for (const match of context.sourceCode.text.matchAll(/^@use\s+(['"])(.+?)\1[^;]*;/gm)) {
                    const group = getUseGroup(match[2]);

                    if (group < highestGroup) {
                        const block = blocks.find(candidate => match.index >= candidate.start && match.index <= candidate.end);
                        const sortedLines = block ? [...block.lines].sort((a, b) => a.group - b.group) : null;

                        const reportObj = {
                            node,
                            loc: {
                                start: context.sourceCode.getLocFromIndex(match.index),
                                end: context.sourceCode.getLocFromIndex(match.index + match[0].length)
                            },
                            message: `@use "${match[2]}" (${groupNames[group]}) must come before the ${groupNames[highestGroup]} @use above it. Order @use rules as: external packages, then "../" paths, then "./" paths, then "sass:" modules.`
                        };

                        if (sortedLines && sortedLines.some((line, index) => line !== block.lines[index])) {
                            reportObj.fix = function(fixer) {
                                return fixer.replaceTextRange([block.start, block.end], sortedLines.map(line => line.text).join(context.sourceCode.text.includes('\r\n') ? '\r\n' : '\n'));
                            };
                        }

                        context.report(reportObj);
                    }

                    if (group > highestGroup) highestGroup = group;
                }
            }
        };
    }
};
