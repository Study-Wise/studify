import Featurebase, { clearConfig, whenReady } from 'featurebase-js';

export const FEATUREBASE_APP_ID = '6acd470c188ccc41b584247c';

// Set on sign-out so the next page that boots the messenger resets it first (see bootFeaturebase)
const RESET_PENDING_KEY = 'featurebase-reset-pending';

let booted = false;

// Sends a command straight to the Featurebase runtime. Until sdk.js has loaded, window.Featurebase is a queue stub
// that the runtime drains in order, so a command sent here runs before any later boot.
function dispatch(action: string) {
    if (typeof window.Featurebase !== 'function') {
        const stub = Object.assign((...args: unknown[]) => {
            stub.q.push(args);
        }, { q: [] as unknown[][] });
        window.Featurebase = stub;
    }
    window.Featurebase(action);
}

// Boots the Featurebase SDK once per page load. Surfaces enabled under
// "General → Manage products" in the dashboard start automatically.
// The JWT is signed server-side by src/components/Featurebase.astro; without it the visitor is anonymous.
// Importing this module doesn't boot anything, so pages that hide Featurebase (see Layout.astro) can still import shutdownFeaturebase.
export function bootFeaturebase() {
    if (booted) return;
    booted = true;

    // The page that signed out may have navigated away before its shutdown reached the runtime,
    // or never loaded the messenger at all (chat pages), so finish the reset before booting.
    // The marker is only removed once the messenger has booted, which means the queued shutdown has run.
    try {
        if (localStorage.getItem(RESET_PENDING_KEY)) {
            dispatch('shutdown');
            whenReady(() => {
                try {
                    localStorage.removeItem(RESET_PENDING_KEY);
                } catch {
                    // Storage became unavailable; the next boot just repeats the harmless shutdown
                }
            });
        }
    } catch {
        // localStorage can be unavailable (e.g. blocked storage); the sign-out page's own shutdown still ran
    }

    const featurebaseJwt = document.querySelector<HTMLElement>('[data-featurebase-jwt]')?.dataset.featurebaseJwt || undefined;

    Featurebase({
        appId: FEATUREBASE_APP_ID,
        featurebaseJwt,
    });
}

// Call after signing out so the next visitor in this browser doesn't inherit the previous user's Featurebase identity.
// featurebase-js's shutdown() waits 250ms before reaching the runtime, which is lost when the page navigates away
// right after sign-out, so the command is dispatched directly instead.
export function shutdownFeaturebase() {
    dispatch('shutdown');
    clearConfig();
    try {
        localStorage.setItem(RESET_PENDING_KEY, 'true');
    } catch {
        // Nothing to persist the reset into; the shutdown above is all that can be done
    }
}
