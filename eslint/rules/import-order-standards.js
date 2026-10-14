import path from 'path';
import fs from 'fs-extra';

function getImportGroup(source) {
    if (
        source === 'drizzle-orm'
        || source.startsWith('drizzle-orm/')
        || (source.startsWith('.') && /(^|\/)db(\/|$)/.test(source.replaceAll('\\', '/')))
    ) {
        return 2;
    }

    if (source === 'astro' || source.startsWith('astro/') || source === '@astrojs' || source.startsWith('@astrojs/')) {
        return 3;
    }

    const frameworks = ['astro', 'svelte', 'react', 'vue', 'solid', 'preact'];
    const styles = ['css', 'scss', 'sass', 'less', 'styl', 'stylus'];
    if (frameworks.find(f => source.toLowerCase().endsWith(`.${f}`)) || styles.find(s => source.toLowerCase().endsWith(`.${s}`))) {
        return 8;
    }

    if (!source.startsWith('.')) {
        if (path.extname(source.toLowerCase()).slice(1).length === 0) {
            return 1;
        }

        if (['js', 'ts'].some(prefix => path.extname(source.toLowerCase()).slice(1).startsWith(prefix) || path.extname(source.toLowerCase()).slice(1).endsWith(prefix))) {
            return 6;
        }

        return 7;
    }

    if (source.startsWith('../')) return 4;
    if (source.startsWith('./')) return 5;
    return 5;
}

function getImportModulePath(source, currentDir) {
    if (!source.startsWith('.')) return null;

    if (source.split('/').length === 1) {
        let targetPath = path.resolve(currentDir, source);
        try {
            const stat = fs.statSync(targetPath, { throwIfNoEntry: false });
            if (stat && stat.isFile()) {
                return path.dirname(targetPath);
            }
        } catch {
            // Ignore errors
        }
        return targetPath;
    }

    try {
        const dirStat = fs.statSync(path.resolve(currentDir, source.split('/').slice(0, -1).join('/')), { throwIfNoEntry: false });
        if (dirStat && dirStat.isDirectory()) {
            for (const entry of fs.readdirSync(path.resolve(currentDir, source.split('/').slice(0, -1).join('/')))) {
                const stat = fs.statSync(path.join(path.resolve(currentDir, source.split('/').slice(0, -1).join('/')), entry), { throwIfNoEntry: false });
                if (stat && stat.isFile() && path.parse(entry).name === source.split('/')[source.split('/').length - 1]) {
                    return path.resolve(currentDir, source.split('/').slice(0, -1).join('/'));
                }
            }
        }
    } catch {
        // Ignore errors
    }

    return path.resolve(currentDir, source);
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Import order standards: group spacing and lib grouping',
            category: 'Best Practices'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                if (!node.body) return;

                if ((node.body || []).filter(statement => statement && statement.type === 'ImportDeclaration').length === 0) return;

                let maxSeenGroup = 0;
                let previousNode = null;
                let previousGroup = null;

                for (const importNode of (node.body || []).filter(statement => statement && statement.type === 'ImportDeclaration')) {
                    if (typeof importNode.source.value !== 'string') continue;

                    const group = getImportGroup(importNode.source.value);

                    if (group < maxSeenGroup) {
                        context.report({
                            node: importNode,
                            message: 'Import order must be: external non-astro/drizzle, then drizzle/db, then astro, then lib imports, then remaining ts/tsx/cjs/mjs imports, then remaining non-(ts/js*/astro/scss) files, then astro/scss files.',
                        });
                    }

                    if (group > maxSeenGroup) {
                        maxSeenGroup = group;
                    }

                    if (previousNode && previousGroup !== null && ((previousGroup !== group && (importNode.loc.start.line || 0) - (previousNode.loc.end.line || 0) < 2) || (previousGroup === group && (importNode.loc.start.line || 0) - (previousNode.loc.end.line || 0) >= 2))) {
                        context.report({
                            node: importNode,
                            message: previousGroup !== group ? `Add a blank line between import groups. Previous: "${previousNode.source.value}" (group ${previousGroup}), Current: "${importNode.source.value}" (group ${group})` : `Remove blank line between same import group (group ${previousGroup}).`,
                        });
                    }

                    previousNode = importNode;
                    previousGroup = group;
                }

                let currentGroupImports = [];
                let currentGroupNumber = null;

                for (const importNode of (node.body || []).filter(statement => statement && statement.type === 'ImportDeclaration')) {
                    if (typeof importNode.source.value !== 'string') continue;

                    const group = getImportGroup(importNode.source.value);

                    if (group !== currentGroupNumber) {
                        currentGroupImports = [];
                        currentGroupNumber = group;
                    }

                    currentGroupImports.push(importNode);

                    if (currentGroupImports.length > 1) {
                        const modules = new Map();
                        for (const imp of currentGroupImports) {
                            if (getImportModulePath(imp.source.value, path.dirname(context.filename))) {
                                if (!modules.has(getImportModulePath(imp.source.value, path.dirname(context.filename)))) modules.set(getImportModulePath(imp.source.value, path.dirname(context.filename)), []);
                                modules.get(getImportModulePath(imp.source.value, path.dirname(context.filename))).push(imp);
                            }
                        }

                        for (const [libPath, libImports] of modules.entries()) {
                            if (libImports.length <= 1) continue;

                            for (let i = 1; i < libImports.length; i++) {
                                let foundOtherImports = false;
                                for (let j = currentGroupImports.indexOf(libImports[i - 1]) + 1; j < currentGroupImports.indexOf(libImports[i]); j++) {
                                    if (getImportModulePath(currentGroupImports[j].source.value, path.dirname(context.filename)) !== libPath) {
                                        foundOtherImports = true;
                                        break;
                                    }
                                }

                                if (foundOtherImports) {
                                    context.report({
                                        node: libImports[i],
                                        message: `Imports from lib "${libPath}" must be grouped together. Group all "${libPath}" imports consecutively.`,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        };
    }
};
