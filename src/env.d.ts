/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        user: import('./lib/types').ExtendedUser | null;
        session: import('better-auth').Session | null;
    }
}