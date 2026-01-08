# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudyWise is an AI-powered educational platform built with Astro that provides personalized tutoring across multiple subjects. The application features category-based learning modes, AI-powered chat interactions, and automated study material generation (study guides, reference sheets, infographics, and webpages).

## Commands

### Development

- `npm run dev` - Start local development server at `localhost:4321`
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally

### Database

- `npx drizzle-kit push` - Push schema changes to PostgreSQL database
- `npx drizzle-kit generate` - Generate migration files from schema changes
- `npx drizzle-kit migrate` - Run pending migrations

## Architecture

### Core Technologies

- **Framework**: Astro 5.x with SSR (server-side rendering)
- **Deployment**: Vercel adapter
- **Authentication**: Clerk (configured in `astro.config.mjs`)
- **Database**: PostgreSQL via Vercel Postgres with Drizzle ORM
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

Tools use the Vercel AI SDK's `tool()` function with Zod schemas for parameters.

### Database Schema

Single table defined in `src/db/schema.ts`:

**threadsTable**: Stores conversation threads with:

- Core fields: `id`, `title`, `email`, `category`, `mode`, `model`, `provider`

- Thread data: `thread` (JSONB storing messages array)
- Generated content: `generatedStudyGuide`, `generatedReferenceSheet`, `generatedInfographic`, `generatedWebpage`, `generatedMindMap`, `generatedAdditionalResources`, `generatedFlashcards`, `generatedPracticeQuestions`
- Metadata: `uploadedFiles`, `isPublic`, `isDev`, `createdAt`, `updatedAt`

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

**Thread & Authentication:**

- **POST /api/thread/toggle-public.ts**: Toggle thread visibility (public/private)
- **POST /api/webhooks/clerk.ts**: Clerk authentication webhooks

### Authentication & Middleware

`src/middleware.ts` implements Clerk authentication:

- Protected routes: `/[category]/[mode]/chat/*`, `/settings`, `/admin`
- Redirects authenticated users away from sign-in/sign-up pages
- Returns users to original URL after authentication
- MFA enforcement available (currently commented out)

Route access control in `src/lib/auth/checkThreadAccess.ts` validates thread ownership.

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
- `CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret (required for admin auto-promotion)
- `OPENAI_API_KEY` - OpenAI API key (also used for image generation)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI key
- `EXA_SEARCH_API_KEY` - Exa search API key
- `UPLOADTHING_TOKEN` - UploadThing token

## Development Guidelines

### CRITICAL: Styling Rules

**NEVER put styles in `.astro` files using `<style>` tags. ALWAYS create separate `.scss` files.**

- **Pages**: Create styles in `src/styles/pages/[page-name].scss`
- **Components**: Create styles in `src/styles/components/[component-name].scss`
- **Import**: Use `import '../styles/pages/[page-name].scss'` in the frontmatter

Example structure:

```astro
---
import Layout from '../layouts/Layout.astro';
import '../styles/pages/my-page.scss';  // ← ALWAYS DO THIS
---

<Layout>
    <div class="my-page-container">
        <!-- content -->
    </div>
</Layout>

<!-- NO <style> TAGS HERE! -->
```

This keeps styles organized, reusable, and maintainable. Inline styles make the codebase messy and harder to maintain.

### Adding New AI Tools

1. Create tool file in `src/lib/tools/[tool-name].ts`
2. Export default object with:
   - Spread `tool()` from `ai` package
   - `description` and `parameters` (Zod schema)
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

1. Middleware checks protected routes
2. Unauthenticated users redirected to `/user/sign-in`
3. After auth, users return to original URL
4. User email from Clerk used for thread ownership
5. Thread access validated in API routes before operations
