// System prompt for the hidden Margo Page support chat (category "support", mode "margo"), sliced from the agent definition in .claude/agents/margo-page.md at the heading where the coding-agent workflow begins, then extended with live app details
import aiConfig from '@/lib/ai.config';
import appConfig from '@/lib/app.config';
import { contentTypes } from '@/lib/content';

import margoAgentDefinition from '../../.claude/agents/margo-page.md?raw';

const CODING_SECTIONS_HEADING = '## Where the real repo is';
const HIDDEN_PAGES = ['chat', 'settings', 'admin', '404'];

const noFrnt = margoAgentDefinition.replace(/^---\n[\s\S]*?\n---\n/, '');
const cutoff = noFrnt.indexOf(CODING_SECTIONS_HEADING);
const basePrompt = (cutoff === -1 ? noFrnt : noFrnt.slice(0, cutoff)).trim();

// Every top-level page file is a page people can visit, so a new page shows up here without an edit
const pageList = Object.keys(import.meta.glob('../pages/*.astro'))
    .map(path => path.replace('../pages/', '').replace('.astro', ''))
    .filter(name => !name.startsWith('_') && !HIDDEN_PAGES.includes(name))
    .sort((a, b) => a === 'index' ? -1 : b === 'index' ? 1 : 0)
    .map(name => {
        if (name === 'index') return '- Home (/)';
        const title = name.replaceAll('-', ' ');
        return `- ${title.charAt(0).toUpperCase()}${title.slice(1)} (/${name})`;
    })
    .join('\n');

// Imported lazily because modes.ts imports this file; the promise settles once the categories are fully built
const prompt = import('@/lib/modes').then(({ default: categories }) => {
    // Mirrors the home page: only modes marked as shown are listed, and categories with none are skipped
    const subjects = Object.entries(categories)
        .map(([categoryKey, category]) => {
            const shownModes = Object.entries(category.modes).filter(([, mode]) => mode.show);
            if (shownModes.length === 0) return null;

            const modes = shownModes.map(([modeKey, mode]) => `    - ${mode.name} (/${categoryKey}/${modeKey}): ${mode.description}`);
            return `- ${category.name}: ${category.description}\n${modes.join('\n')}`;
        })
        .filter((section): section is string => section !== null)
        .join('\n');

    return `${basePrompt}

## Live app details

These details are read straight from our app, so they're always current.

### The app

Our app is called ${appConfig.name} (it used to be called ${appConfig.formerName}) and was made by ${appConfig.creators}.

### Subjects and modes

Each subject has modes, and each mode is its own tutor with its own page. Use these when someone asks what we cover or where to find something:

${subjects}

### Study materials

These are the kinds of study materials people can generate from a chat:

${contentTypes.map(type => `- ${type}`).join('\n')}

### Pages

${pageList}
- Profile (/user/profile)

### Limits

Each person can have up to ${aiConfig.maxThreadsPerUser} chats at a time, and each chat allows ${aiConfig.maxMessagesPerThread} messages from them. After that, they need to delete a chat or start a new conversation.`;
});

export default prompt;
