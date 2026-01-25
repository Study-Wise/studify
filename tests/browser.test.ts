import { test } from '@playwright/test'
import 'dotenv/config'

const base = 'http://localhost:4321';
const path = process.env.BROWSER_TEST_PATH || '';

test('test browser', async ({ page }) => {
    // point this to wherever you want
    await page.goto(`${base}${path.startsWith('/') ? path : `/${path}`}`)

    // keep browser open
    await page.pause()
})