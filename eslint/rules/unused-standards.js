export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Unused variable and import standards',
            category: 'Stylistic Issues'
        },
        fixable: 'code',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                // Check for unused variables and imports (Astro files only)
                if (context.filename.endsWith('.astro')) {
                    if (context.sourceCode.scopeManager?.acquire?.(node)) {
                        context.sourceCode.scopeManager?.acquire?.(node).variables.forEach(variable => {
                            if (variable.defs.length > 0 && variable.references.length === 0 && !variable.name.startsWith('_')) {
                                const def = variable.defs[0];
                                context.report({
                                    loc: def.node.loc,
                                    message: `Variable '${variable.name}' is defined but never used. Prefix with '_' to ignore.`
                                });
                            }
                        });
                    }

                    // Check for unused type imports
                    for (const match of context.sourceCode.getText().matchAll(/import\s+type\s+\{([^}]+)\}\s+from/g)) {
                        match[1].split(',').map(s => s.trim()).forEach(importName => {
                            const baseName = importName.split(/\s+as\s+/)[0].trim();
                            if (baseName.startsWith('_')) return;
                            if (!new RegExp(`\\b${baseName}\\b`).test(context.sourceCode.getText().replace(/import\s+type\s+\{([^}]+)\}\s+from/g, ''))) {
                                context.report({
                                    loc: { line: context.sourceCode.getText().substring(0, match.index).split('\n').length, column: 1 },
                                    message: `Type '${baseName}' is imported but never used. Prefix with '_' to ignore or remove the import.`
                                });
                            }
                        });
                    }
                }
            }
        };
    }
};
