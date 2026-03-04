# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudyWise is an AI-powered educational platform built with Astro that provides personalized tutoring across multiple subjects. The application features category-based learning modes, AI-powered chat interactions, and automated study material generation (study guides, reference sheets, infographics, and webpages).

## Commands

### Development

- `npm run dev` - Start local development server at `localhost:4321`
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally

### Checking

- `npm run check` - Run Astro type checking and SCSS linting (stylelint)

### Database

- `npx drizzle-kit push` - Push schema changes to PostgreSQL database
- `npx drizzle-kit generate` - Generate migration files from schema changes
- `npx drizzle-kit migrate` - Run pending migrations

## Architecture

### Core Technologies

- **Framework**: Astro 5.x with SSR (server-side rendering)
- **Deployment**: Vercel adapter
- **Authentication**: Better Auth (modern authentication framework with email/password, OAuth, and magic links)
- **Database**: PostgreSQL via Neon with Drizzle ORM
- **AI Integration**: Multiple providers via Vercel AI SDK (`ai` package)
- **PWA**: Progressive Web App support via `@vite-pwa/astro`
- **File Uploads**: UploadThing

### AI Provider System

The application supports multiple AI providers defined in `src/lib/models.ts`:

- **OpenAI**: gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o3, o4-mini
- **Google**: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite
- **Vercel**: v0-1.5-md, v0-1.5-lg (internal use only)

Default configuration in `src/lib/config.ts`:

- Provider: `openai`
- Model: `gpt-4.1`
- Image Model: `gpt-image-1` (for infographic generation)

The `src/lib/ai-service.ts` module handles:

- Model/provider validation via `getValidModelAndProvider()`
- AI response generation via `generateAIResponse()` with tool support
- Conversation title generation via `generateTitle()`

### Category and Mode System

The application is organized around educational categories and modes defined in `src/lib/modes.ts`:

**Categories**: Science, Math, Social Studies, Decision Sciences, Engineering, English, Foreign Languages, Arts, Health and Fitness, General

Each category contains multiple modes (e.g., Math → Algebra, Geometry, Calculus). Each mode:

- Has a dynamically generated tutor prompt via `generateTutorPrompt()`
- Can define custom AI tools (defaults to global tools from `src/lib/tools.ts`)
- Maps to URL structure: `/[category]/[mode]/chat/[id]`

### AI Tools System

Tools are defined in `src/lib/tools/*.ts` and automatically imported via `src/lib/tools.ts`:

- **search.ts**: Web search using Exa API
- **runJSCode.ts**: Execute JavaScript code (sanitizes imports for security)

Tools use the Vercel AI SDK's `tool()` function with Zod schemas for inputSchema.

### Database Schema

Application tables defined in `src/db/schema.ts`:

**threadsTable**: Stores conversation threads with:

- Core fields: `id`, `title`, `email`, `category`, `mode`, `model`, `provider`
- Thread data: `thread` (JSONB storing messages array)
- Generated content: `generatedStudyGuide`, `generatedReferenceSheet`, `generatedInfographic`, `generatedWebpage`, `generatedMindMap`, `generatedAdditionalResources`, `generatedFlashcards`, `generatedPracticeQuestions`
- Metadata: `uploadedFiles`, `isPublic`, `isDev`, `createdAt`, `updatedAt`

**questionTable**: Stores Q&A pairs for public knowledge base

Better Auth tables defined in `src/db/auth-schema.ts`:

**user**: User accounts with email, name, image, and verification status
**session**: Active user sessions with expiration and device info
**account**: OAuth provider accounts and credentials
**verification**: Email verification and magic link tokens

Database operations in `src/lib/threads.ts` provide:

- `getMessages(id, email)` - Retrieve thread messages with ownership check
- `getMessagesLength(id)` - Get message count
- `getThreadByToken(id, email)` - Get full thread with ownership check

### API Routes

API endpoints in `src/pages/api/`:

**Chat & Message Generation:**

- **POST /api/message/generate.ts**: Main chat endpoint
  - Handles message generation with AI provider selection
  - Creates/updates threads in database
  - Enforces thread limits per user (configurable in `config.ts`)
  - Returns streaming or complete responses

**Content Generation:**

- **POST /api/study-guide/generate.ts**: Generate study guides from thread
- **POST /api/reference-sheet/generate.ts**: Generate reference sheets
- **POST /api/infographic/generate.ts**: Generate infographics (uses OpenAI image generation)
- **POST /api/webpage/generate.ts**: Generate webpages from thread
- **POST /api/mind-map/generate.ts**: Generate mind maps from thread
- **POST /api/additional-resources/generate.ts**: Generate additional learning resources
- **POST /api/flashcards/generate.ts**: Generate flashcards from thread content
- **POST /api/practice-questions/generate.ts**: Generate practice questions

**Thread Management:**

- **POST /api/thread/toggle-public.ts**: Toggle thread visibility (public/private)

### Authentication & Middleware

`src/middleware.ts` implements Better Auth authentication:

- Protected routes: `/[category]/[mode]/chat/*`, `/settings`, `/admin`, `/user/profile`, `/user/my-chats`
- Redirects authenticated users away from sign-in/sign-up pages
- Returns users to original URL after authentication
- Session management via Better Auth's `auth.api.getSession()`

Route access control in `src/lib/auth/checkThreadAccess.ts` validates thread ownership.

**Authentication Pages:**

- `/user/sign-in` - Email/password and OAuth sign-in (Google, GitHub)
- `/user/sign-up` - Email/password and OAuth sign-up
- `/user/sso-callback` - OAuth callback handler
- `/user/sign-out` - Sign-out confirmation

**Better Auth Configuration:**

- Server: `src/lib/auth.ts` - Better Auth instance with Drizzle adapter
- Client: `src/lib/auth/client.ts` - Client-side auth utilities
- API Handler: `src/pages/api/auth/[...all].ts` - Handles all auth requests
- Database Schema: `src/db/auth-schema.ts` - User, session, account, and verification tables

### Page Structure

Dynamic routing in `src/pages/`:

- **`[category]/[mode]/index.astro`**: Mode landing page
- **`[category]/[mode]/chat/[id].astro`**: Chat interface for thread
- **`[category]/[mode]/study-guide/[id].astro`**: Study guide viewer
- **`[category]/[mode]/reference-sheet/[id].astro`**: Reference sheet viewer
- **`[category]/[mode]/infographic/[id].astro`**: Infographic viewer
- **`[category]/[mode]/webpage/[id].astro`**: Webpage viewer
- **`[category]/[mode]/mind-map/[id].astro`**: Mind map viewer
- **`[category]/[mode]/resources/[id].astro`**: Learning resources viewer
- **`[category]/[mode]/flashcards/[id].astro`**: Flashcards viewer
- **`[category]/[mode]/practice-questions/[id].astro`**: Practice questions viewer

### Component Organization

- **Layouts**: `src/layouts/Layout.astro` - Base layout with PWA support
- **Components**:
  - `src/components/chat/` - Chat UI components (Header, LeftSidebar, RightSidebar, Toolbar)
  - `src/components/fancy/` - Reusable UI components (Button, Select, Tab)
  - `src/accessibility/` - Accessibility features (KeyboardNavigation, ThemeSwitcher, TouchGestures)
- **Scripts**: Client-side scripts in `src/scripts/` (messages.astro, settings.astro, step-by-step.astro)
- **Styles**: SCSS organized in `src/styles/` with variables, utilities, components, and page styles

### Content Generation

Content generation logic in `src/lib/content/`:

- `generate/` - Functions to create new content (study-guide.ts, reference-sheet.ts, infographic.ts, webpage.ts, mind-map.ts, resources.ts, flashcards.ts, practice-questions.ts)
- `latest/` - Functions to retrieve latest generated content from threads

### Environment Variables

Required environment variables (see `.env`):

- `POSTGRES_URL` - PostgreSQL connection string
- `BETTER_AUTH_URL` - Base URL for Better Auth (e.g., [http://localhost:4321](http://localhost:4321) for dev)
- `BETTER_AUTH_SECRET` - Secret key for Better Auth (generate a random 64-char string)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key (also used for image generation)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI key
- `EXA_SEARCH_API_KEY` - Exa search API key
- `UPLOADTHING_TOKEN` - UploadThing token

## Development Guidelines

### CRITICAL: Styling Rules

**NEVER put styles in `.astro` files using `<style>` tags. ALWAYS create separate `.scss` files.**

- **Pages**: Create styles in `src/styles/pages/[page-name].scss`
- **Components**: Create styles in `src/styles/components/[component-name].scss`
- **Import**: Use `import '@/styles/pages/[page-name].scss'` in the frontmatter

Example structure:

```astro
---
import Layout from '@/layouts/Layout.astro';
import '@/styles/pages/my-page.scss';  // ← ALWAYS DO THIS
---

<Layout>
    <div class="my-page-container">
        <!-- content -->
    </div>
</Layout>

<!-- NO <style> TAGS HERE! -->
```

This keeps styles organized, reusable, and maintainable. Inline styles make the codebase messy and harder to maintain.

### CRITICAL: TypeScript Types Convention

**ALL TypeScript types and interfaces MUST be defined in `src/lib/types.ts`.**

- **Never** define types inline in components, pages, or other modules
- **Always** import types from `src/lib/types.ts`
- **Always** export new types from the centralized types file

Example:

```typescript
// ❌ WRONG - Don't define types inline
interface User {
    id: string;
    email: string;
}

// ✅ CORRECT - Import from centralized types
import type { User, Session } from "better-auth";
```

This ensures:

- Type consistency across the codebase
- Easy refactoring and maintenance
- Single source of truth for all type definitions
- Better IDE autocomplete and type checking

### CRITICAL: Error Investigation Protocol

**ALWAYS investigate and search for root causes when encountering errors. NEVER implement tangential fixes without understanding the problem.**

When you encounter an error:

1. **Search First**: Use Grep, Glob, or the Task tool with the Explore agent to search the codebase for:
   - Related error messages or error handling code
   - Similar patterns or implementations
   - Documentation or comments explaining the behavior
   - Type definitions and interfaces involved

2. **Search the Web**: If the error is unclear or related to external libraries/frameworks, use WebSearch to:
   - Look up specific error messages or codes
   - Find documentation for the libraries/packages involved
   - Research best practices for the technology stack
   - Check for known issues or breaking changes in dependencies

3. **Read Context**: Read relevant files completely to understand:
   - How the code is supposed to work
   - What dependencies or imports are involved
   - What other parts of the codebase interact with this code
   - What the actual error message means in context

4. **Verify Understanding**: Before implementing a fix:
   - Confirm you understand the root cause
   - Check if similar issues exist elsewhere
   - Consider if the fix addresses the actual problem or just symptoms
   - Look for existing patterns or solutions in the codebase

5. **Avoid Quick Fixes**: DO NOT:
   - Add `any` types without understanding why type checking is failing
   - Comment out code that's causing errors
   - Add try-catch blocks to suppress errors without handling them
   - Make assumptions about what "should" work without verification
   - Apply fixes from external sources without adapting them to this codebase

Example workflow:

```text
❌ WRONG: "Getting a type error, let me add 'as any' to bypass it"
✅ CORRECT: "Getting a type error. Let me search for the type definition,
understand what's expected, and check how similar code handles this case."
```

This ensures fixes are targeted, maintainable, and don't introduce new issues.

### Adding New AI Tools

1. Create tool file in `src/lib/tools/[tool-name].ts`
2. Export default object with:
   - Spread `tool()` from `ai` package
   - `description` and `inputSchema` (Zod schema)
   - `execute` async function
   - `ready: true` flag
3. Tool will be automatically imported by `src/lib/tools.ts`

### Adding New Categories/Modes

1. Edit `src/lib/modes.ts`
2. Add category to `categories` object with modes
3. Each mode requires: `show`, `name`, `description`, `icon`
4. Prompt is auto-generated; tools default to global tools
5. Create corresponding page structure in `src/pages/[category]/[mode]/`

### Database Schema Changes

1. Modify `src/db/schema.ts`
2. Run `npx drizzle-kit generate` to create migration
3. Run `npx drizzle-kit push` to apply to database
4. Migration files stored in `src/db/migrations/`

### PWA Configuration

PWA settings in `astro.config.mjs`:

- Manifest loaded from `public/manifest.webmanifest`
- Service worker configuration in `workbox` settings
- Runtime caching for fonts, images, and API responses
- Dev mode PWA enabled for testing

### Authentication Flow

1. Middleware checks protected routes using Better Auth's `auth.api.getSession()`
2. Unauthenticated users redirected to `/user/sign-in` with return URL
3. Users can sign in via:
    - Email/password
    - Google OAuth
    - GitHub OAuth
    - Magic links (requires email service configuration)
4. After authentication, users return to original URL
5. User email from Better Auth used for thread ownership
6. Thread access validated in API routes before operations
7. Admin users identified via email whitelist in `src/lib/auth/admin.ts`

### Code Style Guidelines

**CRITICAL: Always use 4 spaces for indentation, never tabs.**
