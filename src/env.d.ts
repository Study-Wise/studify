/// <reference types="astro/client" />

// Not yet in TypeScript's DOM types
interface BeforeInstallPromptEvent extends globalThis.Event {
    prompt(): Promise<void>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
}

declare namespace App {
    interface Locals {
        user: import('./lib/types').User | null;
        session: import('better-auth').Session | null;
    }
}