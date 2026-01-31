import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.test*.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:4321',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: undefined,
});
