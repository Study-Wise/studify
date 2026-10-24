// Node types whose initializer marks a variable as deliberately computed rather than disposable
const COMPLEX_TYPES = new Set([
    'AwaitExpression',
    'CallExpression',
    'NewExpression',
    'ImportExpression',
    'ArrowFunctionExpression',
    'FunctionExpression',
    'ClassExpression',
    'TaggedTemplateExpression'
]);

// Checks whether an expression at any depth contains a deliberately computed construct
function isComplexExpression(node) {
    if (!node || typeof node.type !== 'string') return false;

    if (COMPLEX_TYPES.has(node.type)) return true;
    if (node.type === 'TemplateLiteral' && node.expressions.length > 0) return true;
    if (node.type === 'Literal' && node.regex) return true;

    for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        if (Array.isArray(node[key]) && node[key].some(isComplexExpression)) return true;
        else if (isComplexExpression(node[key])) return true;
    }

    return false;
}

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
                // Collect names re-exported through a separate `export { ... }` list, whose usage lives in other files
                const exportNames = new Set();
                for (const statement of node.body) {
                    if (statement.type === 'ExportNamedDeclaration') {
                        for (const specifier of statement.specifiers) {
                            if (specifier.local) exportNames.add(specifier.local.name);
                        }
                    }
                }

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
                if (context.filename.endsWith('.d.ts')) return;

                context.sourceCode.scopeManager.scopes.forEach(scope => {
                    scope.variables.forEach(variable => {
                        if (!variable.defs[0]) return;
                        if (variable.defs[0].type !== 'Variable' && variable.defs[0].type !== 'FunctionName') return;

                        if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(variable.name)) return;
                        if (
                            variable.defs[0].parent?.type?.startsWith('Export') ||
                            variable.defs[0].parent?.parent?.type?.startsWith('Export') ||
                            variable.defs[0].node.parent?.type?.startsWith('Export') ||
                            variable.defs[0].node.parent?.parent?.type?.startsWith('Export') ||
                            exportNames.has(variable.name)
                        ) return;
                        if (variable.defs[0].parent?.parent?.type === 'ForOfStatement' || variable.defs[0].parent?.parent?.type === 'ForInStatement') return;
                        if (variable.defs[0].parent?.parent?.type === 'ForStatement') return;

                        // Allow variables that get reassigned (e.g. state accumulators or mutable trackers)
                        if (variable.references.some(ref => ref.isWrite())) return;
                        // Object destructuring is excluded because pulling named fields out of a struct is deliberate
                        if (
                            variable.defs[0].node.init &&
                            variable.defs[0].node.id.type !== 'ObjectPattern' &&
                            (
                                (
                                    variable.defs[0].node.init.type === 'MemberExpression' &&
                                    !isComplexExpression(variable.defs[0].node.init.object) &&
                                    (
                                        (!variable.defs[0].node.init.computed && variable.defs[0].node.id.type === 'Identifier') ||
                                        (
                                            variable.defs[0].node.init.computed && (
                                                variable.defs[0].node.init.property.type === 'Literal' ||
                                                (variable.defs[0].node.init.property.type === 'UnaryExpression' && variable.defs[0].node.init.property.operator === '-')
                                            )
                                        )
                                    )
                                ) ||
                                (
                                    variable.defs[0].node.init.type === 'Identifier' &&
                                    variable.defs[0].node.id.type === 'ArrayPattern' &&
                                    variable.defs[0].node.id.elements.length === 1 &&
                                    variable.defs[0].node.id.elements[0] !== null
                                )
                            )
                        ) {
                            context.report({
                                node: variable.defs[0].node,
                                message: `Variable '${variable.name}' is a needless alias of '${context.sourceCode.getText(variable.defs[0].node.init)}'.`
                            });
                            return;
                        }

                        const reads = variable.references.filter(ref => ref.isReadOnly() || ref.isReadWrite()).length;
                        if (variable.defs[0].type === 'FunctionName' && reads !== 1) return;
                        if (variable.defs[0].type !== 'FunctionName' && reads !== 1 && reads !== 2) return;

                        // A deliberately computed initializer (call, await, function, long expression) earns its variable even at low use
                        if (isComplexExpression(variable.defs[0].node.init)) return;
                        if (variable.defs[0].node.init && context.sourceCode.getText(variable.defs[0].node.init).length >= 80) return;
                        // Pulling named fields out of a struct is deliberate even at low use
                        if (variable.defs[0].node.id.type === 'ObjectPattern') return;
                        // A type annotation (not a cast) on the variable, a parameter or the return type is deliberate even at low use
                        if (variable.defs[0].node.id?.typeAnnotation || variable.defs[0].node.returnType || variable.defs[0].node.params?.some(param => param.typeAnnotation || param.left?.typeAnnotation)) return;

                        context.report({
                            node: variable.defs[0].node,
                            message: `Variable '${variable.name}' is only used ${reads} time${reads === 1 ? '' : 's'}.`
                        });
                    });
                });
            }
        };
    }
};
