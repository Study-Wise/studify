// System prompt for the hidden Margo Page support chat (category "support", mode "margo"), sliced from the agent definition in .claude/agents/margo-page.md at the heading where the coding-agent workflow begins, then extended with live app details
import aiConfig from '@/lib/ai.config';
import appConfig from '@/lib/app.config';
import { contentTypes } from '@/lib/content';
import modeDefinitions from '@/lib/mode-definitions';

import margoAgentDefinition from '../../.claude/agents/margo-page.md?raw';

const CODING_SECTIONS_HEADING = '## Where the real repo is';

const noFrnt = margoAgentDefinition.replace(/^---\n[\s\S]*?\n---\n/, '');
const cutoff = noFrnt.indexOf(CODING_SECTIONS_HEADING);
const basePrompt = (cutoff === -1 ? noFrnt : noFrnt.slice(0, cutoff)).trim();

const subjects = Object.entries(modeDefinitions)
    .map(([categoryKey, category]) => {
        const shownModes = Object.entries(category.modes).filter(([, mode]) => mode.show);
        if (shownModes.length === 0) return null;

        const modes = shownModes.map(([modeKey, mode]) => `${mode.modeName} (/${categoryKey}/${modeKey})`);
        return `- ${category.name}: ${category.description}\n    Modes: ${modes.join(', ')}`;
    })
    .filter((section): section is string => section !== null)
    .join('\n');

const pages = Object.keys(import.meta.glob('../pages/*.astro'))
    .map(path => path.replace('../pages/', '').replace('.astro', ''))
    .filter(name => !name.startsWith('_') && !appConfig.hiddenPages.includes(name))
    .sort((a, b) => a === 'index' ? -1 : b === 'index' ? 1 : 0)
    .map(name => {
        if (name === 'index') return '- Home (/)';
        const title = name.replaceAll('-', ' ');
        return `- ${title.charAt(0).toUpperCase()}${title.slice(1)} (/${name})`;
    })
    .join('\n');

const prompt = `${basePrompt}

## Live app details

These details are read straight from our app, so they're always current.

### The app

Our app is called ${appConfig.name} (it used to be called ${appConfig.formerName}) and was made by ${appConfig.creators}.

### Subjects and modes

You're support, not a tutor, so don't answer study questions yourself. Each subject has modes, and each mode is its own tutor with its own page. Use this list only to tell people where to find a subject, or to send them to the mode that fits their study question. Only mention the one or two that fit instead of reading the whole list out:

${subjects}

### Study materials

These are the kinds of study materials people can generate from a chat:

${contentTypes.map(type => `- ${type}`).join('\n')}

### Pages

${pages}
- Profile (/user/profile)

### Limits

Each person can have up to ${aiConfig.maxThreadsPerUser} chats at a time, and each chat allows ${aiConfig.maxMessagesPerThread} messages from them. After that, they need to delete a chat or start a new conversation.`;

export default prompt;
