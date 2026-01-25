# StudyWise

StudyWise is an AI-powered educational platform that helps students turn their homework into comprehensive learning materials. Built with Astro and powered by multiple AI providers, it generates personalized study guides, flashcards, infographics, and more.

## Features

StudyWise offers a comprehensive suite of AI-generated study materials:

- **Study Guides** - Personalized explanations with worked examples, practice problems, and key terms
- **Reference Sheets** - Concise summaries with key formulas and definitions for quick review
- **Infographics** - Visual summaries of complex topics for at-a-glance understanding
- **Flashcards** - Interactive question-and-answer format for effective memorization
- **Practice Questions** - Targeted questions to test understanding and reinforce learning
- **Webpages** - Comprehensive topic pages with full content in web format
- **Mind Maps** - Visual concept connections showing relationships between ideas
- **Learning Resources** - Curated videos, articles, tutorials, and documentation automatically found based on your topics
- **File Uploads** - Share homework, notes, and materials via UploadThing integration
- **Multi-Provider AI** - Support for OpenAI and Google AI models
- **Public Sharing** - Make your study materials public to help other students

## Tech Stack

- **Framework**: Astro 5.x with SSR (server-side rendering)
- **Deployment**: Vercel adapter
- **Authentication**: Clerk
- **Database**: PostgreSQL via Vercel Postgres with Drizzle ORM
- **AI Integration**: Multiple providers via Vercel AI SDK
  - OpenAI: gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o3, o4-mini
  - Google: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite
- **PWA**: Progressive Web App support via @vite-pwa/astro
- **File Uploads**: UploadThing
- **Search**: Exa API for web search

## Project Structure

```text
/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── chat/        # Chat interface components
│   │   ├── fancy/       # Styled UI components
│   │   └── accessibility/ # Accessibility features
│   ├── db/              # Database schema and migrations
│   ├── layouts/         # Page layouts
│   ├── lib/             # Core application logic
│   │   ├── content/     # Content generation functions
│   │   ├── tools/       # AI tools (search, code execution)
│   │   ├── auth/        # Authentication helpers
│   │   ├── modes.ts     # Category and mode definitions
│   │   ├── models.ts    # AI provider configurations
│   │   └── ai-service.ts # AI response generation
│   ├── pages/           # Astro pages and API routes
│   │   ├── [category]/[mode]/ # Dynamic mode pages
│   │   │   ├── chat/[id].astro
│   │   │   ├── study-guide/[id].astro
│   │   │   ├── reference-sheet/[id].astro
│   │   │   ├── infographic/[id].astro
│   │   │   ├── flashcards/[id].astro
│   │   │   ├── practice-questions/[id].astro
│   │   │   ├── webpage/[id].astro
│   │   │   ├── mind-map/[id].astro
│   │   │   └── additional-resources/[id].astro
│   │   └── api/         # API endpoints
│   ├── scripts/         # Client-side scripts
│   └── styles/          # SCSS stylesheets
└── package.json
```

## Commands

All commands are run from the root of the project:

### Development

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

### Database

| Command | Action |
| :--- | :--- |
| `npx drizzle-kit push` | Push schema changes to PostgreSQL database |
| `npx drizzle-kit generate` | Generate migration files from schema changes |
| `npx drizzle-kit migrate` | Run pending migrations |

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
POSTGRES_URL=your_postgres_connection_string

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Providers
OPENAI_API_KEY=your_openai_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key

# Search
EXA_SEARCH_API_KEY=your_exa_search_api_key

# File Uploads
UPLOADTHING_TOKEN=your_uploadthing_token
```

## How It Works

1. **Choose a subject and mode** from the available categories (Math, Science, Social Studies, etc.)
2. **Start a conversation** with the AI tutor about your topic
3. **Upload files** (optional) to share homework, notes, or other materials
4. **Generate study materials** using the sidebar options:
   - Click "Generate Study Guide" for comprehensive explanations
   - Click "Generate Reference Sheet" for quick review materials
   - Click "Generate Infographic" for visual summaries
   - Click "Generate Flashcards" for memorization practice
   - Click "Generate Practice Questions" for self-testing
   - Click "Generate Webpage" for shareable web content
   - Click "Generate Mind Map" for concept visualization
   - Click "Find Resources" for curated external learning materials
5. **Share your work** by toggling the thread visibility to public
6. **Save or print** any content for offline use

## Categories and Modes

StudyWise supports multiple educational categories, each with specialized modes:

- **Science** - Biology, Chemistry, Physics, Earth Science, Astronomy
- **Math** - Algebra, Geometry, Calculus, Statistics, Trigonometry
- **Social Studies** - History, Geography, Civics, Economics
- **Decision Sciences** - Data Analysis, Business Analytics
- **Engineering** - Computer Science, Electrical Engineering, Mechanical Engineering
- **English** - Literature, Writing, Grammar
- **Foreign Languages** - Spanish, French, German, Mandarin
- **Arts** - Music, Visual Arts, Theater
- **Health and Fitness** - Nutrition, Exercise Science
- **General** - General topics and questions

## Architecture Highlights

### AI Tools System

Tools are defined in `src/lib/tools/*.ts` and automatically imported. Each tool provides specific functionality:

- **search.ts** - Web search using Exa API
- **runJSCode.ts** - Execute JavaScript code (with security sanitization)

### Content Generation

Content generation logic is organized in `src/lib/content/`:

- `generate/` - Functions to create new content
- `latest/` - Functions to retrieve latest generated content from threads

### Database Schema

Single table `threadsTable` stores conversation threads with:

- Core fields: id, title, email, category, mode, model, provider
- Thread data: thread (JSONB storing messages array)
- Generated content: generatedStudyGuide, generatedReferenceSheet, generatedInfographic, generatedWebpage, generatedMindMap, generatedAdditionalResources, generatedFlashcards, generatedPracticeQuestions
- Metadata: uploadedFiles, isPublic, isDev, createdAt, updatedAt

## Development Guidelines

### Styling Rules

**NEVER put styles in `.astro` files using `<style>` tags. ALWAYS create separate `.scss` files.**

- Pages: Create styles in `src/styles/pages/[page-name].scss`
- Components: Create styles in `src/styles/components/[component-name].scss`
- Import: Use `import '@/styles/pages/[page-name].scss'` in the frontmatter

## Contributors

- **Rien Gupta** - Creator and Developer
- **Adarsh R. Kumar** - Co-Developer

## License

This project is proprietary software developed by Rien Gupta and Adarsh R. Kumar.

## Links

- [LinkedIn - Rien Gupta](https://linkedin.com/in/riengupta/)
- [Website - Adarsh R. Kumar](https://adarshrkumar.dev/)
- [LinkedIn - Adarsh R. Kumar](https://linkedin.com/in/adarshrkumar/)
- [GitHub - Adarsh R. Kumar](https://github.com/adarshrkumar)
