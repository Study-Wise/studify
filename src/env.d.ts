/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        user: import('./lib/types').NeonUser | null;
        session: import('./lib/types').NeonSession | null;
    }
}