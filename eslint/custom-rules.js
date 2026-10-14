import fs from 'fs-extra';

const ruleFiles = fs.readdirSync('./eslint/rules').filter(f => f.endsWith('.js') && !f.startsWith('_'));

export const rules = Object.fromEntries(
    await Promise.all(
        ruleFiles.map(async file => {
            const name = file.replace('.js', '');
            const mod = await import(`./rules/${file}`);
            return [name, mod.default];
        })
    )
);

export const ruleConfigs = Object.fromEntries(
    Object.keys(rules).map(key => [`custom/${key}`, 'error'])
);
