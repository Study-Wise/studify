function parseUse(source) {
    if (source.startsWith('sass:')) return { group: 4, up: 0, dirs: [], name: source };

    const segments = source.split('/');
    let group = 1;
    let up = 0;

    if (source.startsWith('../')) {
        group = 2;

        while (segments[0] === '..') {
            up++;
            segments.shift();
        }
    }
    else if (source.startsWith('./')) {
        group = 3;
        segments.shift();
    }

    const name = segments.pop();

    return { group, up, dirs: segments, name };
}

function compareUses(a, b) {
    if (a.group !== b.group) return a.group - b.group;
    if (a.up !== b.up) return b.up - a.up;

    for (let i = 0; i < Math.min(a.dirs.length, b.dirs.length); i++) {
        if (a.dirs[i] !== b.dirs[i]) return a.dirs[i] < b.dirs[i] ? -1 : 1;
    }

    if (a.dirs.length !== b.dirs.length) return a.dirs.length - b.dirs.length;

    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'SCSS @use order standards: sorted by external packages, then ../ paths, then ./ paths, then sass: modules, with folders and files in alphabetical order',
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
                    const lineMatch = line.replace(/\r$/, '').match(/^@use\s+(['"])(.+?)\1[^;]*;[ \t]*$/);

                    if (lineMatch) {
                        if (!currentBlock) {
                            currentBlock = { start: offset, end: offset, lines: [] };
                            blocks.push(currentBlock);
                        }

                        currentBlock.lines.push({ text: line.replace(/\r$/, ''), source: lineMatch[2] });
                        currentBlock.end = offset + line.replace(/\r$/, '').length;
                    }
                    else currentBlock = null;

                    offset += line.length + 1;
                }

                let highestSource = null;

                for (const match of context.sourceCode.text.matchAll(/^@use\s+(['"])(.+?)\1[^;]*;/gm)) {
                    if (highestSource !== null && compareUses(parseUse(highestSource), parseUse(match[2])) > 0) {
                        const block = blocks.find(candidate => match.index >= candidate.start && match.index <= candidate.end);
                        const sortedLines = block ? [...block.lines].sort((a, b) => compareUses(parseUse(a.source), parseUse(b.source))) : null;

                        const reportObj = {
                            node,
                            loc: {
                                start: context.sourceCode.getLocFromIndex(match.index),
                                end: context.sourceCode.getLocFromIndex(match.index + match[0].length)
                            },
                            message: `@use "${match[2]}" must come before "${highestSource}". Sort @use rules as: external packages, then "../" paths (farthest first), then "./" paths, then "sass:" modules. Within each, a folder's files come before its subfolders, alphabetically.`
                        };

                        if (sortedLines && sortedLines.some((line, index) => line !== block.lines[index])) {
                            reportObj.fix = function(fixer) {
                                return fixer.replaceTextRange([block.start, block.end], sortedLines.map(line => line.text).join(context.sourceCode.text.includes('\r\n') ? '\r\n' : '\n'));
                            };
                        }

                        context.report(reportObj);
                    }

                    if (highestSource === null || compareUses(parseUse(highestSource), parseUse(match[2])) < 0) highestSource = match[2];
                }
            }
        };
    }
};
