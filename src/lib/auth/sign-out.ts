// Client-side sign-out that also removes the user's data from this browser, so the next person on a shared computer can't see it
import { authClient } from '@/lib/auth/client';

// Caches holding user content: generated material pages and images (astro.config.mjs) and the offline copy (OfflineSupport.astro)
const USER_CACHES = ['study-materials-cache', 'images-cache', 'studywise-offline-v1'];

// localStorage keys holding the user's chats and settings. Device preferences (theme, install prompt) are kept.
const USER_STORAGE_KEYS = ['threadId', 'settings', 'model'];

async function clearUserCaches() {
    // Best effort: browsers can refuse Cache Storage access (e.g. some private modes), which mustn't block signing out.
    // In that case the service worker couldn't have stored anything there either.
    try {
        if (!('caches' in window)) return;
        const results = await Promise.allSettled(USER_CACHES.map((name) => caches.delete(name)));
        for (const result of results) {
            if (result.status === 'rejected') console.error('Failed to delete cache:', result.reason);
        }
    } catch (error) {
        console.error('Cache Storage is unavailable:', error);
    }
}

function clearUserStorage() {
    try {
        for (const key of USER_STORAGE_KEYS) {
            localStorage.removeItem(key);
        }
    } catch {
        // localStorage is unavailable, so there is nothing stored to remove
    }
}

export async function signOutAndClearData() {
    // Clear local data even if the server sign-out fails, so a user who walks away from a shared device doesn't leave it behind
    clearUserStorage();
    await clearUserCaches();

    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message || 'Sign out failed');
}
