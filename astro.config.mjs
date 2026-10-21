import fs from 'fs-extra';
import AstroPWA from '@vite-pwa/astro';
import sentryAstro from '@sentry/astro';

import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const contentTypes = fs.readdirSync('src/lib/content/latest')
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .map(file => file.slice(0, -'.ts'.length));

// https://astro.build/config
export default defineConfig({
    site: 'https://studywise.adarshrkumar.app',
    output: 'server',
    adapter: vercel(),
    integrations: [
        AstroPWA({
            registerType: 'autoUpdate',
            includeAssets: [
                '/favicon.svg',
                '/favicon.ico',
                '/assets/logos/logo.png',
                '/assets/logos/logo.svg'
            ],
            manifest: fs.readJSONSync('public/manifest.webmanifest'),
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                // Pages are server-rendered, so there is no precached shell; the default route would also catch every navigation
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: ({ request, url }) =>
                            request.mode === 'navigate' &&
                            /^\/[^/]+\/[^/]+\/(?:flashcards|study-guide|reference-sheet|summary|practice-questions|additional-resources|slideshow|mind-map)\/[^/]+\/?$/.test(url.pathname),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'study-materials-cache',
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            },
                            cacheableResponse: {
                                statuses: [200]
                            },
                            plugins: [
                                {
                                    // Don't store the sign-in page under a study material URL
                                    cacheWillUpdate: async ({ response }) => response.redirected ? null : response
                                }
                            ]
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    }
                ],
                skipWaiting: true,
                clientsClaim: true
            },
            devOptions: {
                enabled: true
            }
        }),
        sentryAstro(),
        sitemap({
            filter: page =>
                !page.includes('/api/') &&
                !page.includes('/chat/') &&
                !contentTypes.some(type => page.includes(`/${type}/`)) &&
                !page.includes('/user/sso-callback'),
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: new Date(),
        }),
    ],
});