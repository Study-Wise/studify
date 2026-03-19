/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        user: import('./lib/types').User | null;
        session: import('better-auth').Session | null;
    }
}