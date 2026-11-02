import sentryAstro from '@sentry/astro';
import AstroPWA from '@vite-pwa/astro';
import fs from 'fs-extra';

import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

import appConfig from './src/lib/app.config.ts';
import runtimeCaching from './src/lib/cache.config.ts';

const contentTypes = fs.readdirSync('src/lib/content/latest')
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .map(file => file.slice(0, -'.ts'.length));

const manifest = {
    name: appConfig.name,
    short_name: appConfig.name,
    description: appConfig.subtitle,
    start_url: '/',
    display: 'standalone',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    icons: [
        {
            src: '/assets/logos/favicon.png',
            sizes: '1024x1024',
            type: 'image/png'
        },
        ...[512, 192, 64, 32].map(size => ({
            src: `/assets/logos/pwa-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'any maskable'
        }))
    ]
};

fs.writeJSONSync('public/manifest.webmanifest', manifest, { spaces: 4 });

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
            manifest,
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: null,
                runtimeCaching,
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