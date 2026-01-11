CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text NOT NULL,
	"mode" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"viewCount" text DEFAULT '0' NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"thread" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploadedFiles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"email" text,
	"category" text DEFAULT 'general' NOT NULL,
	"mode" text DEFAULT 'general' NOT NULL,
	"model" text DEFAULT 'gpt-4.1' NOT NULL,
	"provider" text DEFAULT 'openai' NOT NULL,
	"generatedStudyGuide" text,
	"generatedReferenceSheet" text,
	"generatedInfographic" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generatedWebpage" text,
	"generatedMindMap" text,
	"generatedAdditionalResources" text,
	"generatedFlashcards" text,
	"generatedPracticeQuestions" text,
	"isPublic" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"isDev" boolean DEFAULT true NOT NULL
);
