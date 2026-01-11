// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';

import fs from 'fs-extra';
import path from 'path';

import sentry from '@sentry/astro';

const manifestPath = path.join(process.cwd(), 'public', 'manifest.webmanifest');
const manifest = fs.readJSONSync(manifestPath);

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: vercel(),
    integrations: [
        clerk({
            // Authentication configuration
            signInUrl: '/user/sign-in',
            signUpUrl: '/user/sign-up',
            signInFallbackRedirectUrl: '/',
            signUpFallbackRedirectUrl: '/',

            // Appearance customization
            appearance: {
                variables: {
                    colorPrimary: '#6366f1',
                    colorText: '#374151',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#f9fafb',
                    colorInputText: '#374151',
                },
                elements: {
                    formButtonPrimary: 'auth-button',
                    card: 'auth-card',
                    headerTitle: 'auth-title',
                    headerSubtitle: 'auth-subtitle',
                    socialButtonsBlockButton: 'social-button',
                    socialButtonsBlockButtonText: 'social-button-text',
                    formFieldInput: 'form-input',
                    formFieldLabel: 'form-label',
                    footerActionLink: 'footer-link'
                }
            },

            // Localization
            localization: {
                signUp: {
                    start: {
                        subtitle: 'to access StudyWise',
                    },
                    emailCode: {
                        subtitle: 'to access StudyWise',
                    },
                },
                signIn: {
                    start: {
                        subtitle: 'to access StudyWise',
                    },
                },
            },
        }), 
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
        sentry({
        project: "studywise",
        org: "adarshrkumar",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
    ],
});