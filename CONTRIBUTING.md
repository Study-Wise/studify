# Contributing to Studify

Thanks for helping improve Studify. This guide covers how to report issues, set up the project, and open a pull request.

## Reporting issues

Search existing issues first to avoid duplicates, then [open a new issue](https://github.com/Study-Wise/studywise/issues/new/choose) and pick the template that fits. Each template describes what it is for.

## Getting started

1. Fork and clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in the values.
4. Start the dev server with `npm run dev` (runs at `localhost:4321`).

## Before you open a pull request

- Create a branch from `main`.
- Keep the PR focused on one change.
- Run `npm run check` and fix everything it reports (ESLint, Astro type checking, SCSS linting and a production build).
- Link the issue your PR addresses, if there is one.
- Include screenshots for any UI change.

## Code guidelines

### Formatting

- Use **4 spaces** for indentation, never tabs.

### Styling

- Never use `<style>` tags in `.astro` files. Put styles in separate `.scss` files.
- Page styles go in `src/styles/pages/[page-name].scss`.
- Component styles go in `src/styles/components/[component-name].scss`.
- Import the stylesheet in the component or page frontmatter, for example `import '@/styles/pages/my-page.scss';`.

### TypeScript

- Define all types and interfaces in `src/lib/types.ts` and import them from there.
- Never use `any`. Use a proper type, or `unknown` with a type guard.
- Fix the root cause of type errors instead of bypassing them.

### Import order

Separate import groups with a blank line and skip empty groups.

**`.ts` files (non-API)**

1. External packages (`ai`, `zod`, `nanoid`, `better-auth`, and so on)
2. Database imports (`drizzle-orm` and `@/db/*`, together)
3. `@/lib/*` and relative imports

**API routes (`src/pages/api/**`)**

1. Astro imports (`import type { APIRoute } from 'astro'`)
2. External packages
3. Database imports (`drizzle-orm` and `@/db/*`, together)
4. `@/lib/*` imports

**`.astro` files**

1. Astro component imports and SCSS imports together, with no blank line between them
2. External packages
3. Other TypeScript imports (`@/lib/*`, `@/db/*`)

### Database changes

1. Edit `src/db/schema.ts`.
2. Run `npx drizzle-kit generate` to create a migration.
3. Commit the generated files in `src/db/migrations/`.

### Mind maps and webpages

The mind map and webpage generators are near copies of each other and are kept in sync. Apply changes that affect both to both files:

- `src/lib/content/generate/mind-map.ts` and `src/lib/content/generate/webpage.ts`
- `src/pages/api/mind-map/generate.ts` and `src/pages/api/webpage/generate.ts`

## Adding categories and modes

1. Edit `src/lib/modes.ts`.
2. Add the category to the `categories` object, with its modes.
3. Give each mode a `show`, `name`, `description` and `icon`.
4. The mode prompt is generated automatically, and tools default to the global tools.

No new pages or API routes are needed. `src/pages/[category]/[mode]/` is a dynamic route, so every mode is served automatically.

## Adding AI tools

1. Create the tool file at `src/lib/tools/[tool-name].ts`.
2. Export a default object that contains:
    - the spread of `tool()` from the `ai` package
    - a `description` and an `inputSchema` (Zod schema)
    - an async `execute` function
    - the `ready: true` flag
3. The tool is imported automatically by `src/lib/tools.ts`.

## Adding a new content type

A content type is a kind of generated study material, such as a study guide, flashcards or a summary. Use an existing one, for example `summary`, as a reference. Names below use kebab-case for files and PascalCase for status keys.

1. Create the generator at `src/lib/content/generate/[type].ts`. Build the prompt with `buildContentSystemPrompt()` and store the result with `saveContent()`.
2. Create the retriever at `src/lib/content/latest/[type].ts` using `getLatestContent()`. The file name registers the type automatically.
3. In `src/lib/content/latest/index.ts`, add the `has[Type]` flag to `ThreadContentStatus` and to the default status, and add the key to `ThreadContent`.
4. In `src/lib/content/index.ts`, add the type to `contentTypes` and `contentTypeDescriptions`.
5. Create the API route at `src/pages/api/[type]/generate.ts`. It should authenticate the user, check thread ownership and call your generator.
6. Create the viewer page at `src/pages/[category]/[mode]/[type]/[id].astro` and its stylesheet at `src/styles/pages/content/[type].scss`. Import both the stylesheet and `src/styles/pages/content/globals.scss` in the page, validate the category and mode, and check access with `checkThreadAccess()`.
7. In `src/components/chat/RightSidebar.astro`, add a `[type]Url` constant and a `SidebarSection` card. Add the `has[Type]` prop to its inputs as well.
8. Add the button label for the type to `viewButtonTexts` in `src/scripts/messages.astro`. Without it the button falls back to "View" plus the type name.

No database migration is needed. Generated content is stored in the `content` JSONB column of the threads table.
