/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
    auth: import('@clerk/astro/server').Auth;
    }
}