# Beads Setup Guide for StudyWise

## What is Beads?

Beads is a distributed, git-backed task tracking system specifically designed for AI coding agents. It provides persistent, structured memory for coding agents by replacing informal markdown plans with a dependency-aware task graph.

## Why Beads for StudyWise?

- **Persistent Memory**: AI agents can maintain context across long-horizon tasks
- **Dependency Tracking**: Understand task relationships and what's blocking what
- **Git-Backed**: Task data is stored in the `.beads/` directory using JSONL format
- **Multi-Agent Support**: Handle parallel workflows across different branches
- **Semantic Summarization**: Completed tasks are summarized to preserve context

## Installation

Beads is already configured in this project. To install it:

```bash
npm install
```

If the automatic installation fails, you can install manually:

```bash
# Using Homebrew (macOS)
brew install steveyegge/beads/bd

# Using Go
go install github.com/steveyegge/beads/cmd/bd@latest

# Or download from releases
# https://github.com/steveyegge/beads/releases
```

## Configuration

The project includes a `.beadsrc` configuration file with these settings:

- **Default Priority**: 3 (medium priority for new tasks)
- **Auto-sync**: Enabled (automatically commits task changes)
- **Summarization**: Enabled (preserves context by summarizing completed tasks)
- **Agent Mode**: Enabled (optimized for AI agents)
- **JSON Output**: Enabled (structured output for agent processing)

## NPM Scripts

Convenient npm scripts are available for common Beads commands:

```bash
npm run beads:init       # Initialize Beads in the repository
npm run beads:ready      # Show tasks that are ready to work on (no blockers)
npm run beads:create     # Create a new task
npm run beads:list       # List all tasks
npm run beads:status     # Show overall project status
npm run beads:show       # Show detailed information about a specific task
```

## Getting Started

### 1. Initialize Beads (First Time Only)

```bash
npm run beads:init
```

This creates the `.beads/` directory structure.

### 2. Create Your First Task

```bash
# Using npm script
npm run beads:create

# Or directly with bd
bd create "Add user authentication feature" --priority 5
```

### 3. See What's Ready to Work On

```bash
npm run beads:ready
```

This shows all unblocked tasks that can be worked on immediately.

## Common Workflows

### Creating a Task Hierarchy

```bash
# Create an epic (high-level feature)
bd create "Implement AI chat improvements" --priority 5 --epic

# Create tasks under the epic
bd create "Add streaming responses" --parent <epic-id> --priority 4
bd create "Implement tool calling" --parent <epic-id> --priority 4

# Create subtasks
bd create "Update API endpoint" --parent <task-id> --priority 3
bd create "Update frontend components" --parent <task-id> --priority 3
```

### Adding Dependencies

```bash
# Task B depends on Task A (Task A blocks Task B)
bd dep add <task-b-id> <task-a-id>

# View a task's dependencies
bd show <task-id>
```

### Updating Task Status

```bash
# Start working on a task
bd start <task-id>

# Mark a task as completed
bd done <task-id>

# Block a task
bd block <task-id> "Waiting for API key"
```

### Viewing Task Details

```bash
# Show full task information with history
bd show <task-id>

# List all tasks in JSON format
bd list --json

# Show project status
npm run beads:status
```

## Task Priorities

Use these priority levels:

- **5**: Critical/Highest - Must be done immediately
- **4**: High - Important features or bug fixes
- **3**: Medium - Regular features and improvements (default)
- **2**: Low - Nice to have features
- **1**: Lowest - Future considerations

## Task States

Tasks progress through these states:

- **open**: Task is ready to be worked on (default)
- **in_progress**: Currently being worked on
- **blocked**: Cannot proceed until blocker is resolved
- **done**: Task is completed
- **cancelled**: Task is no longer needed

## Integration with AI Agents

Beads is designed for AI agents like Claude Code. When working with tasks:

1. **Use JSON output** for structured parsing:
   ```bash
   bd ready --json
   bd list --json
   bd show <task-id> --json
   ```

2. **Check ready tasks** before starting work:
   ```bash
   bd ready
   ```

3. **Update status** as you progress:
   ```bash
   bd start <task-id>
   # ... do work ...
   bd done <task-id>
   ```

4. **Create dependencies** when tasks are related:
   ```bash
   bd dep add <dependent-task> <blocker-task>
   ```

## Storage and Syncing

- **Git-backed**: Task data is stored in `.beads/` directory
- **JSONL format**: Each task is stored in a human-readable JSONL file
- **Auto-sync**: Changes are automatically committed (when `auto_sync=true`)
- **SQLite cache**: Excluded from git (see `.gitignore`) for performance
- **Merge-friendly**: Hash-based IDs prevent conflicts across branches

## Stealth Mode (Optional)

To use Beads locally without committing to the repository:

```bash
bd init --stealth
```

This keeps task data local only and doesn't commit to git.

## Advanced Features

### Semantic Summarization

Completed tasks are automatically summarized to preserve context while managing token usage in AI conversations.

### Multi-Branch Support

Beads handles parallel workflows across different git branches without conflicts thanks to hash-based task IDs.

### Background Daemon

Beads can run a background daemon for automatic synchronization:

```bash
bd daemon start
```

## Troubleshooting

### Installation Issues

If npm install fails, try manual installation:

```bash
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
```

### Permission Issues

Ensure the `.beads/` directory has proper permissions:

```bash
chmod -R 755 .beads/
```

### Sync Issues

Force a sync if auto-sync isn't working:

```bash
bd sync
```

## Learn More

- **GitHub Repository**: https://github.com/steveyegge/beads
- **Documentation**: Check the repository README for detailed documentation
- **Issues**: Report problems at https://github.com/steveyegge/beads/issues

## Example: Adding a New Feature

Here's a complete workflow for adding a new feature to StudyWise:

```bash
# 1. Create an epic for the feature
bd create "Add flashcard feature" --priority 5 --epic
# Output: Created task abc123

# 2. Create subtasks
bd create "Design flashcard data model" --parent abc123 --priority 4
# Output: Created task def456

bd create "Implement flashcard API endpoints" --parent abc123 --priority 4
# Output: Created task ghi789

bd create "Build flashcard UI components" --parent abc123 --priority 4
# Output: Created task jkl012

# 3. Add dependencies (API depends on data model)
bd dep add ghi789 def456

# 4. See what's ready
bd ready
# Shows: def456, jkl012 (ghi789 is blocked)

# 5. Start working on data model
bd start def456
# ... implement the data model ...
bd done def456

# 6. Now API work is unblocked
bd ready
# Shows: ghi789, jkl012

# 7. Continue with remaining tasks
bd start ghi789
# ... implement API ...
bd done ghi789

bd start jkl012
# ... build UI ...
bd done jkl012

# 8. Complete the epic
bd done abc123

# 9. View the completed work
bd show abc123
```

## Tips for AI Agents

1. **Always check `bd ready`** before starting new work to see unblocked tasks
2. **Use `--json` flag** for structured output that's easy to parse
3. **Create epics** for large features to organize related tasks
4. **Add dependencies** to prevent working on tasks out of order
5. **Update status promptly** to keep the task graph accurate
6. **Use priorities** to focus on the most important work first
