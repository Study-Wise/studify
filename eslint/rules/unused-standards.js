export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Unused and low-use variable/import standards',
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
                                context.report({
                                    loc: variable.defs[0].node.loc,
                                    message: `Variable '${variable.name}' is defined but never used. Prefix with '_' to ignore.`
                                });
                            }
                        });
                    }

                    // Check for unused type imports
                    for (const match of context.sourceCode.getText().matchAll(/import\s+type\s+\{([^}]+)\}\s+from/g)) {
                        match[1].split(',').map(s => s.trim()).forEach(importName => {
                            if (importName.split(/\s+as\s+/)[0].trim().startsWith('_')) return;
                            if (!new RegExp(`\\b${importName.split(/\s+as\s+/)[0].trim()}\\b`).test(context.sourceCode.getText().replace(/import\s+type\s+\{([^}]+)\}\s+from/g, ''))) {
                                context.report({
                                    loc: { line: context.sourceCode.getText().substring(0, match.index).split('\n').length, column: 1 },
                                    message: `Type '${importName.split(/\s+as\s+/)[0].trim()}' is imported but never used. Prefix with '_' to ignore or remove the import.`
                                });
                            }
                        });
                    }
                }

                // Variables used only once or twice are not allowed
                if (!context.sourceCode.scopeManager) return;

                context.sourceCode.scopeManager.scopes.forEach(scope => {
                    scope.variables.forEach(variable => {
                        const definition = variable.defs.find(defItem => defItem.type === 'Variable');
                        if (!definition) return;

                        if (variable.name.startsWith('_')) return;
                        if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(variable.name)) return;
                        if (definition.parent?.parent?.type?.startsWith('Export')) return;
                        if (definition.parent?.parent?.type === 'ForOfStatement' || definition.parent?.parent?.type === 'ForInStatement') return;

                        const reads = variable.references.filter(ref => ref.isReadOnly() || ref.isReadWrite()).length;
                        if (reads !== 1 && reads !== 2) return;

                        context.report({
                            node: definition.node,
                            message: `Variable '${variable.name}' is only used ${reads} time${reads === 1 ? '' : 's'}.`
                        });
                    });
                });
            }
        };
    }
};
