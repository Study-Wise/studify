/// <reference types="astro/client" />

import type { NeonUser, NeonSession } from './lib/types';

declare namespace App {
    interface Locals {
        user: NeonUser | null;
        session: NeonSession | null;
    }
}