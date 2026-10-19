/// <reference types="astro/client" />

declare var document: typeof document;

// Not yet in TypeScript's DOM types
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
}

// Set by src/components/Dialog.astro
interface Window {
    keyboardNavigation: object;
    authUtils: import('./lib/auth/types').AuthUtils;
    showDialog: (message: string, options?: { title?: string; icon?: string; type?: import('./lib/modal').ModalType }) => void;
    showToast: (message: string, options?: { title?: string; icon?: string; type?: import('./lib/modal').ModalType }) => void;
    showConfirm: (message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string; icon?: string; type?: import('./lib/modal').ModalType }) => Promise<boolean>;
    showPrompt: (message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string; icon?: string; type?: import('./lib/modal').ModalType; inputLabel?: string; placeholder?: string; maxLength?: number }) => Promise<string | null>;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showSuccess: (message: string) => void;
    showSuccessAfterNavigation: (message: string) => void;
    showInfo: (message: string) => void;
}

declare namespace App {
    interface Locals {
        user: import('./lib/types').User | null;
        session: import('better-auth').Session | null;
    }
}
