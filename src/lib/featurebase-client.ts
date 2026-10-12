import Featurebase from 'featurebase-js';

export const FEATUREBASE_APP_ID = '6acd470c188ccc41b584247c';

// Boots the Featurebase SDK once per page load. Surfaces enabled under
// "General → Manage products" in the dashboard start automatically.
// The JWT is signed server-side by src/components/Featurebase.astro; without it the visitor is anonymous.
const featurebaseJwt = document.querySelector<HTMLElement>('[data-featurebase-jwt]')?.dataset.featurebaseJwt || undefined;

Featurebase({
    appId: FEATUREBASE_APP_ID,
    featurebaseJwt,
});
