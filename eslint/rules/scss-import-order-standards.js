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

    for (let i = 0; i < Math.min(a.dirs.length, b.dirs.length); i++) if (a.dirs[i] !== b.dirs[i]) return a.dirs[i] < b.dirs[i] ? -1 : 1;

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

                let highestSource = null;

                for (const match of context.sourceCode.text.matchAll(/^@use\s+(['"])(.+?)\1[^;]*;/gm)) {
                    if (highestSource !== null && compareUses(parseUse(highestSource), parseUse(match[2])) > 0) {
                        context.report({
                            node,
                            loc: {
                                start: context.sourceCode.getLocFromIndex(match.index),
                                end: context.sourceCode.getLocFromIndex(match.index + match[0].length)
                            },
                            message: `@use "${match[2]}" after "${highestSource}" out of the order of external packages, then "../" paths (farthest first), then "./" paths, then "sass:" modules, with a folder's files before its subfolders, alphabetically found.`,
                            fix(fixer) {
                                const uses = context.sourceCode.text.matchAll(/^@use\s+(['"])(.+?)\1[^;]*;/gm).toArray();

                                return uses.map((use, index) => fixer.replaceTextRange([use.index, use.index + use[0].length], uses.toSorted((a, b) => compareUses(parseUse(a[2]), parseUse(b[2])))[index][0]));
                            }
                        });
                    }

                    if (highestSource === null || compareUses(parseUse(highestSource), parseUse(match[2])) < 0) highestSource = match[2];
                }
            }
        };
    }
};
