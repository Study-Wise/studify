export default [
    {
        urlPattern: ({ request, url }: { request: Request; url: URL }) =>
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
            cacheableResponse: { statuses: [200] },
            plugins: [
                { cacheWillUpdate: async ({ response }: { response: Response }) => response.redirected ? null : response }
            ]
        }
    },
    {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
            cacheName: 'google-fonts-cache',
            expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: { statuses: [0, 200] }
        }
    },
    {
        urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
            cacheName: 'images-cache',
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
            }
        }
    }
];
