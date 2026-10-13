import Featurebase, { shutdown, clearConfig } from 'featurebase-js';

export const FEATUREBASE_APP_ID = '6acd470c188ccc41b584247c';

let booted = false;

// Boots the Featurebase SDK once per page load. Surfaces enabled under
// "General → Manage products" in the dashboard start automatically.
// The JWT is signed server-side by src/components/Featurebase.astro; without it the visitor is anonymous.
// Importing this module doesn't boot anything, so pages that hide Featurebase (see Layout.astro) can still import shutdownFeaturebase.
export function bootFeaturebase() {
    if (booted) return;
    booted = true;

    const featurebaseJwt = document.querySelector<HTMLElement>('[data-featurebase-jwt]')?.dataset.featurebaseJwt || undefined;

    Featurebase({
        appId: FEATUREBASE_APP_ID,
        featurebaseJwt,
    });
}

// Call after signing out so the next visitor in this browser doesn't inherit the previous user's Featurebase identity.
export function shutdownFeaturebase() {
    shutdown();
    clearConfig();
}
