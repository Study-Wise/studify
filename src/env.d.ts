/// <reference types="astro/client" />

// Not yet in TypeScript's DOM types
interface BeforeInstallPromptEvent extends globalThis.Event {
    prompt(): Promise<void>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
}

// Set by src/components/Dialog.astro
interface Window {
    showDialog: (message: string, options?: { title?: string; icon?: string; type?: import('./lib/modal').ModalType }) => void;
    showToast: (message: string, options?: { title?: string; icon?: string; type?: import('./lib/modal').ModalType }) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showSuccess: (message: string) => void;
    showInfo: (message: string) => void;
}

declare namespace App {
    interface Locals {
        user: import('./lib/types').User | null;
        session: import('better-auth').Session | null;
    }
}