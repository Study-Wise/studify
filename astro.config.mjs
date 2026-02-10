// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';
import vercel from '@astrojs/vercel';

import fs from 'fs-extra';
import path from 'path';

import sentryAstro from '@sentry/astro';
import sitemap from '@astrojs/sitemap';

const manifestPath = path.join(process.cwd(), 'public', 'manifest.webmanifest');
const manifest = fs.readJSONSync(manifestPath);

// https://astro.build/config
export default defineConfig({
    site: 'https://studywise.onl',
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
            manifest,
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
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
                    },
                    {
                        urlPattern: /^\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 5 // 5 minutes
                            },
                            networkTimeoutSeconds: 10
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
            filter: (page) =>
                !page.includes('/api/') &&
                !page.includes('/chat/') &&
                !page.includes('/study-guide/') &&
                !page.includes('/reference-sheet/') &&
                !page.includes('/infographic/') &&
                !page.includes('/webpage/') &&
                !page.includes('/mind-map/') &&
                !page.includes('/resources/') &&
                !page.includes('/flashcards/') &&
                !page.includes('/practice-questions/') &&
                !page.includes('/user/sso-callback'),
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: new Date(),
        }),
    ],
});