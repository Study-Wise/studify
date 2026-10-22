// System prompt for the hidden Margo Page support chat (category "support", mode "margo"), sliced from the agent definition in .claude/agents/margo-page.md at the heading where the coding-agent workflow begins
import margoAgentDefinition from '../../.claude/agents/margo-page.md?raw';

const CODING_SECTIONS_HEADING = '## Where the real repo is';

const noFrnt = margoAgentDefinition.replace(/^---\n[\s\S]*?\n---\n/, '');
const cutoff = noFrnt.indexOf(CODING_SECTIONS_HEADING);
const prompt = (cutoff === -1 ? noFrnt : noFrnt.slice(0, cutoff)).trim();

export default prompt;
