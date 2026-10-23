# Codebase Audit — Studify

## 1. Verification snapshot

Commands run from the repo root:

| Check | Result |
| --- | --- |
| `npx astro build` | ✅ Succeeds (SSR output built) |
| `npx astro check` | ❌ **10 errors**, 3 hints |
| `npx eslint . --max-warnings 0` | ❌ **47 errors** |
| `npx stylelint "./**/*.scss"` | ✅ Clean |
| `npm audit --omit=dev` | ❌ **94 vulnerabilities**: 11 critical, 45 high, 32 moderate, 6 low |
| `npm run check` (CI) | ❌ Fails (eslint + astro check) |

**Headline:** `main` cannot pass its own CI (`npm run check`). The production build works only because the broken `/about` code is never executed during an SSR build. There is one critical security issue and several verified functional breakages.

## 2. Critical

- [ ] **C3. Stored XSS from AI-generated Markdown/HTML**

  Verified: `marked` v15 passes raw HTML through unchanged (`marked.parse('<script>alert(1)</script>')` returns the script tag). No sanitizer or CSP is applied before `set:html`/`innerHTML`.

  Sinks:

  - [ ] `src/pages/[category]/[mode]/chat/[id].astro:88,163` — assistant messages parsed with `marked` and injected via `set:html`.
  - [ ] `src/scripts/messages.astro:500,670` — `messageContent.innerHTML = data.generatedText`; also `:412`.
  - [ ] `src/components/ContentActions.astro:87` — `contentDiv.innerHTML = parsedContent`.
  - [ ] `src/pages/[category]/[mode]/study-guide/[id].astro:37,58`; same pattern in `summary`, `reference-sheet`, `practice-questions`, `flashcards` (`:79,91,95`) and `question/[id].astro:160`.
  - [ ] `src/components/chat/LeftSidebar.astro:573-584` — uploaded `file.name`/`file.key` interpolated into `innerHTML` unescaped (self-XSS, and visible on public threads).

  Because content is stored in the thread and re-rendered on reload, a model reply containing `<img src=x onerror=...>` (reachable through prompt injection) becomes persistent same-origin script execution for every viewer.

## 3. High

- [ ] **H1. `/about` is broken at runtime**

  `src/pages/about.astro:19,52,55,56`

  `TeamData`, `getRegularImage`, and `getHoverImage` are referenced but do not exist anywhere in the repo. `astro check` reports 4 errors; rendering `/about` throws `ReferenceError: getRegularImage is not defined`. Confirmed the identifiers are absent repo-wide (only in source and stale `.vercel/output`). `random` (line 16) is also dead.

- [ ] **H2. CI is red: 10 type errors and 47 lint errors**

  - [ ] `src/pages/about.astro` — missing types/functions, 3 implicit `any` params (lines 19, 52, 55, 56, 77, 86).
  - [ ] `src/lib/genai-image.ts:17` — `TS2367`, `config.imageSize` is narrowed to `'1024x1536'`, so comparison with `'auto'` is impossible under `satisfies Config`.
  - [ ] `src/lib/modes.ts:403` — `TS7053`, indexing `characters[topicKey]` with a `string`.
  - [ ] `src/lib/content/generate/slideshow.ts:99` — `cheerio.load(...)` typed as `Root`, `.text()` missing (see H12/H13 dependency mismatch).
  - [ ] Lint: `no-undef` for `user` in `src/components/TawkTo.astro:17-47`, and for the undefined names in `about.astro`; 40+ custom `custom/unused-standards` errors (one-use helper functions) in `messages.astro`, `LeftSidebar.astro`, `ContentActions.astro`, etc.
  - [ ] CI `npm run check` runs exactly these commands (`.github/workflows/check.yml`), so every push/PR is failing.

- [ ] **H3. Homepage search shows "No subjects match" when there ARE matches**

  `src/pages/index.astro:147,157-158`

  ```ts
  card.hidden = visibleModes === 0;
  if (empty && visibleModes > 0) empty.hidden = false;
  ```

  `empty.hidden` is set to `false` (visible) precisely when a card has matching modes. It is only hidden when still empty on entry, and never shown when zero matches. The empty-state logic is inverted.

- [ ] **H4. Regenerate does nothing for Summary and Additional Resources**

  `src/components/ContentActions.astro:43-48,61-137`

  `markdownTypes` omits `summary`; `additional-resources` appears in no type list. `updatePageContent()` falls through every branch and returns without rendering. The API routes return success, and the button flips to "Regenerate …", but the page keeps showing "No Summary Found" / "No Resources Found" (or stale content).

- [ ] **H5. OAuth completion fallback is broken (`define:vars` cannot serialize a function)**

  `src/pages/user/sso-callback.astro:20-21`

  ```astro
  <script is:inline define:vars={{ getSafeReturnBackUrl }}>
    const redirectUrl = getSafeReturnBackUrl(...);
  ```

  Astro serializes `define:vars` with `JSON.stringify`, which drops functions. The emitted variable is `undefined`, so the script throws `TypeError`. The `catch` retries the same failing call. The normal OAuth path usually survives because the server-side redirect at line 7 fires first when the session cookie is already present; any visit that relies on this page's script (or a timing/cookie edge case) hangs on "Completing authentication...".

- [ ] **H6. Per-user thread limit is bypassable**

  `src/pages/api/message/generate.ts:68-108` vs `:264-298`

  The limit is checked only when no `id` is supplied. Supplying a fresh, non-existent `id` skips the check; the first-message branch then inserts a thread with that client-chosen ID (`onConflictDoUpdate`). Unlimited threads can be created this way, bypassing `maxThreadsPerUser` (5).

- [ ] **H7. `checkThreadAccess` fails open**

  `src/lib/auth/check-thread-access.ts:49-97`

  - DB errors are swallowed (line 89), leaving `threadOwner = null`; line 96 treats `!threadOwner` as authorized. A failed lookup therefore returns `isAuthorized: true`.
  - The NULL-owner claim (`:80-82`) is an unconditional `UPDATE ... WHERE id`; two concurrent first visitors both become "owner". Any authenticated user can also claim an unowned thread through this path.
  - `chat/[id].astro:58` only rejects when a second query also returns null, so a transient DB failure can expose a private thread.

- [ ] **H8. Arbitrary UploadThing file deletion**

  `src/pages/api/files/delete.ts:19-48`

  The route verifies only that the caller owns `threadId`; it never verifies `fileKey` belongs to that thread's `uploadedFiles` before calling `deleteFiles(fileKey)`. File keys for public threads are rendered into markup (`src/components/chat/LeftSidebar.astro:113-114`), so any user can create a thread and delete another user's uploaded file. `fileKey` is not type-checked and `deleteFiles` also accepts arrays.

- [ ] **H9. Unauthenticated AI generation + database write**

  `src/pages/api/question/generate.ts:14-19,36-46,55-79,99`

  - The route never reads `locals.user`; middleware does not protect `/api/*`.
  - Anyone can spend AI credits, insert public rows, and run up cost with no rate limit or input length limit.
  - `category`/`mode` are interpolated into the system prompt (prompt injection).
  - `questionToId()` (`src/lib/question-utils.ts:1-8`) can return an empty string or collide; the check-then-insert races, causing 500s on the primary key.

- [ ] **H10. Chunked uploads are broken on Vercel and can exhaust memory**

  `src/lib/chunked-upload-store.ts:14`, `src/pages/api/files/upload-chunk.ts:50-101`, `src/pages/api/files/upload-complete.ts:58-107`

  - Upload state is a module-level `Map`. On Vercel each request can hit a different lambda, so chunks from one upload land on different instances; `upload-complete` then returns "Missing chunks". Files over ~3.5 MB use this path (`LeftSidebar.astro:392-434`).
  - `fileSize` is client-declared and is the only size check; actual chunk bytes are never measured. `totalChunks` is unbounded, `new Array(totalChunks)` is attacker-sized, and the assembled file is never re-checked against 10 MB.
  - Stale entries are only cleaned in `upload-complete` (`:47`), so abandoned uploads accumulate forever in instances that never get a completion.

- [ ] **H11. Any signed-in user can write study materials to someone else's public thread**

  `src/pages/api/study-guide/generate.ts:65-74` and the same check in all ten routes (`flashcards:64`, `infographic:64`, `mind-map:65`, `practice-questions:65`, `reference-sheet:65`, `slideshow:64`, `summary:65`, `additional-resources:65`, `webpage:65`)

  Condition: `thread.email !== user.email && !thread.isPublic`. Public is treated as **writable**, not just readable. A non-owner can trigger AI/image/UploadThing work and overwrite the owner's stored content via `saveContent()`. The UI hides the button from non-owners (`ContentActions.astro:23`), so API and UI authorization disagree.

- [ ] **H12. Direct dependency/supply-chain risk**

  `package.json`, `npm audit`

  - 11 critical advisories, including direct dependencies `astro`, `better-auth`, and `slideshow-generator`.
  - `slideshow-generator` pulls ancient, vulnerable transitive packages into the server bundle: `cheerio@0.20`, `crypto-js@3.3`, `front-matter@2.3`, `highlight.js@9.18`, `jade@1.11`, `request`, `constantinople`, `uglify-js` — several with RCE/SSRF advisories.
  - `cheerio`, `crypto-js`, `front-matter`, `highlight.js`, and `jade` are imported in `src/lib/content/generate/slideshow.ts` / required via `createRequire`, but are **not declared** in `package.json`. They only resolve because of hoisting from `slideshow-generator`; a different package manager or hoisting layout breaks the slideshow feature.
  - `@types/cheerio@0.22` is installed while the resolved `cheerio` is 0.20, which is the source of the slideshow type error.

- [ ] **H13. Type/import breakages hidden by SSR**

  - [ ] `src/lib/genai-image.ts:17` (see H2).
  - [ ] `src/lib/modes.ts:403` (see H2).
  - [ ] `src/pages/about.astro` (see H1).
  - [ ] `src/lib/ai-service.ts:9` unused `JSONValue` import.
  - [ ] `src/scripts/user.astro:5` computes `callbackURL` but never uses it (line 17 recomputes it); currently harmless dead code.

- [ ] **H14. `modeObj` can be `undefined` in the message API**

  `src/pages/api/message/generate.ts:36-37,123,249`

  ```ts
  let modeObj: Mode = { name: '', description: '' };
  if (category && mode) modeObj = categories[category]?.modes?.[mode];
  ```

  The optional chain can produce `undefined`, which is assigned over the typed default. Later `modeObj.prompt` (line 123) throws a `TypeError`, turning an invalid category/mode into a generic 400. There is no validation that `category`/`mode` exist in `src/lib/modes.ts`.

- [ ] **H15. Concurrent messages lose data**

  `src/pages/api/message/generate.ts:143-170,434-439`; `src/lib/check-for-one-message.ts:31-64`

  The route reads the whole `thread` JSONB array, appends in memory, and writes the whole value back. Two concurrent requests each write their own snapshot, silently losing one message/reply pair. `checkForOneMessage` does the same during a **GET page render** and can clobber a message POST that lands between its read and write. It also performs an AI call on page load (cost + retryability).

- [ ] **H16. Model/provider allowlist bypass**

  `src/lib/models.ts:38-44,56-64`

  - `vercel` (v0 models) and arbitrary tiers are only hidden in the UI (`selectableInUI`, `getSelectableProviders`); the API accepts `provider: 'vercel'` directly.
  - An invalid provider returns the raw `providerKey` while falling back to `config.model`, producing a nonsensical `invalid/gemini-...` pair and a failed AI call.

- [ ] **H17. `additional-resources` page trusts unvalidated JSON shape**

  `src/pages/[category]/[mode]/additional-resources/[id].astro:35-42,69-197`

  `JSON.parse` is wrapped in try/catch, but the result is used as `resourcesData.simulations.map(...)` with no array checks. Malformed or partially generated AI/Exa output crashes the page with a `TypeError`.

## 4. Medium

- [ ] **M1. `checkThreadAccess` side effects on every page view** — `src/lib/auth/check-thread-access.ts:80-82`: an authorization check performs a DB write (claiming ownership). Called from every chat/material page render (`chat/[id].astro:47`, all content pages). Concurrent views race.

- [ ] **M2. Content generation is inconsistent and duplicated** — Ten `src/pages/api/*/generate.ts` files are ~90–100-line copies differing mainly in content type. They duplicate auth, email validation, thread lookup, and error handling, and they have already drifted (line numbers/shape differ). Any fix must be applied ten times.

- [ ] **M3. Duplicate title generation** — `src/pages/api/message/generate.ts:459-469` and `:480-490`: both blocks run for an empty title; the second executes after `controller.close()` and makes another LLM call. It is usually a no-op because the first update changed the title, but it burns tokens and can race a user rename. The first also uses `config.model`/`config.provider` rather than the thread's model (`:302-306`).

- [ ] **M4. Wrong provider persisted in a fallback insert** — `src/pages/api/message/generate.ts:285,295`: the first-message branch writes the raw client `provider` instead of the resolved `selectedProvider`. If the client omits it, the inserted row can disagree with `model`, or rely on the DB default.

- [ ] **M5. Chunk/file `uploadedFiles` are read-modify-write** — `src/pages/api/files/upload.ts:128-137`, `upload-complete.ts:131-140`, `delete.ts:54-60`: concurrent uploads/deletes lose metadata entries; files can remain in UploadThing without a DB reference.

- [ ] **M6. UploadThing token fallback can silently use the wrong account** — `src/lib/uploadthing.ts:10-13,67-69`: `createUploadThingUtils('USERFILES_UPLOADTHING_TOKEN', ...)` falls back to `UPLOADTHING_TOKEN` when the user-files token is missing, so user uploads would be written to the wrong UploadThing app. App IDs are hardcoded (`06kq2k6jjh`, `rsmwe6uny3`). `getFileUrl()` uses `utfs.io` while `listFiles()` uses `${appId}.ufs.sh` (line 53 vs 48), an inconsistency that will break one of the two URL formats.

- [ ] **M7. PDF/image text extraction is a placeholder** — `src/lib/file-processing.ts:1-31`: PDFs and images return metadata strings ("Text extraction requires pdf-parse", "OCR requires Tesseract.js"), so uploaded homework files are never actually read, despite the UI promising file support (`mode index.astro:89-93`). This is a partially implemented feature, not a working one.

- [ ] **M8. `getContentTypesList()` includes `index`**

  `src/lib/content/get-types.ts:2-6` — the glob `./latest/**.ts` matches `index.ts`, and the filter only removes `null`. Consequences:

  - `getContentTypes()` (the `get-content-types` tool) reports `index` as a content type.
  - `getThreadContentStatus()` (`latest/index.ts:82-86`) processes it, with fallback `statusKey = 'hasSummary'`.
  - `open-content`'s enum (`src/lib/tools/open-content.ts:7-9`) includes `index`.

  The middleware defensively filters it (`middleware.ts:12`), but the other consumers do not.

- [ ] **M9. `viewCount` is `text`, increments are non-atomic** — `src/db/schema.ts:31`; `src/pages/[category]/[mode]/question/[id].astro:33-39`: stored as a string, read/parse/increment/write, so concurrent views lose increments and SQL aggregation/sorting is impossible.

- [ ] **M10. Missing indexes on hot lookups** — `src/db/schema.ts:7-22`: no index on `threads.email` or `threads.updatedAt`. Every thread-limit check loads all rows for the user (`message/generate.ts:73`, `thread/initialize.ts:28`), and `getUserThreads` filters+orders (`src/lib/threads.ts:120-126`). This becomes a full scan + sort as the table grows.

- [ ] **M11. DB env var mismatch** — `src/db/initialize.ts:6` reads `DATABASE_URL`; `drizzle.config.ts:8` and `AGENTS.md`/`.env.example` document `POSTGRES_URL`. A deployment that provides only `POSTGRES_URL` (typical Neon/Vercel integration) passes `undefined` to `neon()` at module load, breaking every DB route.

- [ ] **M12. Admin authorization and write routes disagree** — `src/lib/auth/check-thread-access.ts:94-97` grants admins page access, so admins see the Toolbar and Generate buttons (`chat/[id].astro:181`, `ContentActions.astro:23`), but every write API compares only `thread.email === user.email` and returns 403. Admins cannot actually use the controls they are shown.

- [ ] **M13. Dev auth maps roles incorrectly and needs no token** — `src/lib/auth/dev.ts:15-35,52,79-99`; `src/middleware.ts:69-75`: when `NODE_ENV=development` and `USER_ACCESS_TOKEN` is set, every unauthenticated request is authenticated as that account; the request never presents the token. `getDevUser` also maps `premium`/`banned` to `'user'`, so a banned dev account bypasses the ban check.

- [ ] **M14. Thread creation accepts unvalidated category/mode** — `src/pages/api/thread/initialize.ts:14,53-54`: arbitrary strings are persisted; the resulting chat page then redirects to `/404` (`chat/[id].astro:25`). This route also skips the email-format check the other thread mutations use.

- [ ] **M15. Raw internal errors leaked to clients** — `thread/delete.ts:102`, `thread/rename.ts:127`, `thread/toggle-public.ts:109`, `thread/initialize.ts:74`, `files/delete.ts:74`: `error.message` is returned directly, unlike content routes which use `getUserErrorMessage`. DB/driver details leak to callers.

- [ ] **M16. Sentry tunnel has no size/rate/origin controls** — `src/pages/api/sentry-tunnel.ts:10,35-44`: buffers the entire body, is unauthenticated in middleware, and forwards a client-supplied `X-Forwarded-For`. Anyone can burn the project's Sentry quota or spoof source IPs.

- [ ] **M17. `getMessagesLength` writes before authorization is established** — `src/lib/threads.ts:84-103`; `chat/[id].astro:68`: called for any thread ID before the page decides authorization. For legacy string-encoded threads it performs an `UPDATE` at line 95 with no ownership check, and it leaks message counts for arbitrary IDs.

- [ ] **M18. `messages.astro` swallows server stream errors** — `src/scripts/messages.astro:504-507`: `throw new Error(data.error)` is inside the same `try` as `JSON.parse`, so the `catch` only logs it. The stream just ends: no error shown, typing indicator removed, input unlocked. `readHomeStream` (`:389`) handles the same case correctly, so behavior is inconsistent.

- [ ] **M19. `localStorage` parse can throw before the error handler** — `src/scripts/messages.astro:24-30,87`: `JSON.parse(localStorage.getItem(...))` has no try/catch and runs before the main `try` at line 110. A blocked/corrupt store causes an unhandled rejection after the input was already cleared (line 98), losing the user's message.

- [ ] **M20. Chat page inline script has unguarded DOM access** — `src/pages/[category]/[mode]/chat/[id].astro:193-228`: `messageInput.value`, `document.querySelector('.send-button').click()`, and `chatMessages.scrollTo(...)` have no null checks. Any markup change or read-only render throws on the page. `clientMessages` is collected and never used.

- [ ] **M21. Keyboard navigation traps focus** — `src/accessibility/KeyboardNavigation.astro:37-53`: document-wide Tab/Shift+Tab wrapping keeps focus in the page (cannot reach browser chrome) and fights the modal `Dialog`. `offsetParent !== null` also excludes `position: fixed` controls.

- [ ] **M22. Settings/model selection is dead** — `src/pages/settings.astro:6-10`, `src/scripts/settings.astro` (imported nowhere), `src/pages/[category]/[mode]/index.astro:97` (`ModelSelector` commented out). Provider/tier can never be changed, so `getProviderAndTier()` always falls back to the default.

- [ ] **M23. Admin dashboard is not routable** — `src/pages/_admin.astro`: Astro ignores files starting with `_`, so there is no `/admin` route; middleware still guards and redirects to `/admin`, producing a 404. Its buttons have no handlers.

- [ ] **M24. Broken/stale navigation**

  - [ ] `src/components/MyChats.astro:10` redirects to `/user/my-chats`, which has no page (only middleware rules).
  - [ ] `src/scripts/messages.astro:708` builds `/chat/${id}` (missing category/mode); currently dead code.
  - [ ] `src/components/Nav.astro:18` + `Header.astro:23` never pass `pTitle`, so no nav item is ever marked active.

- [ ] **M25. Dead offline fallback** — `src/components/OfflineSupport.astro:118-126`: returns `window.offlineCache.getCachedStudyMaterials()` from the catch path, but `cacheStudyMaterials()` is never called, so the fallback always throws.

- [ ] **M26. `files/delete` and upload routes duplicate the allowed-type list** — `src/pages/api/files/upload.ts:52-78` and `upload-complete.ts:14-32` maintain separate copies that have already diverged (macro-enabled MIME types). Easy to drift.

- [ ] **M27. Content-type/name mismatches in the slideshow generator** — `src/lib/content/generate/slideshow.ts:25-28,99,109-113`: relies on `slideshow-generator/node_modules/marked` via `createRequire` (hoisting-dependent), on undeclared `jade`, and on `crypto-js` with a constant key `'-'` (line 121). Not a security boundary, but misleading and fragile.

- [ ] **M28. `parseThreadData` repairs invalid JSON with a lossy regex** — `src/lib/threads.ts:31-47`: `replace(/,\s*([\]}])/g, '$1')` rewrites any `,` before a closing brace/bracket, including inside string values. It also throws on any malformed message, and every caller catches and silently returns empty (`getMessages`), so corrupt threads render blank.

## 5. Low

- [ ] `L1` `src/components/TawkTo.astro:8-11` mutates `Astro.locals.user` in place and `createHmac().update(null)` would throw if a provider returns no email; `hash`/`emailHash` are also serialized to the browser (intended, but worth documenting).
- [ ] `L2` `src/middleware.ts:40-48` returns `200` for **every** HEAD request before auth, including `/admin` and `/settings`.
- [ ] `L3` `src/pages/404.astro:27` uses `href="javascript:history.back()"`, which a strict CSP blocks and which fails with no history.
- [ ] `L4` `src/accessibility/TouchGestures.astro:96,116` animates `--spin`, which names no `@keyframes`; no `touchcancel` handler leaves `isPulling` stuck.
- [ ] `L5` `src/components/UserButton.astro:8-36` lacks `aria-haspopup`, `aria-expanded`, Escape handling, and focus management.
- [ ] `L6` `src/layouts/Layout.astro:131-138` calls `input.addEventListener` outside the null guard; `:190` injects parser error text into `innerHTML`.
- [ ] `L7` `src/scripts/messages.astro:20-22,32-38` — `destroyIdIfEmptyConvo` does not delete anything, and `visibilitychange` sets `state = 'on'` instead of `'off'`, so the hidden branch can never run twice.
- [ ] `L8` `src/scripts/messages.astro:326-331` interpolates model-influenced `url`/`buttonText` into an `href` inside `innerHTML`.
- [ ] `L9` `src/lib/tools/generate-content.ts:74-75` — existence check for non-object content is convoluted and treats any non-null value as present; `specialCases` only covers `additional-resources`.
- [ ] `L10` `src/lib/phet.ts:12,43` builds `embedUrl` that is never used; the `Simulation` field is dead.
- [ ] `L11` `src/lib/content/index.ts:2-13` — content-type names are duplicated between this list, `contentTypeDescriptions`, the `generate/` files, and the `latest/` files.
- [ ] `L12` `src/lib/content/generate/webpage.ts:75-88` and `mind-map.ts:99-112` hardcode `anthropic/claude-haiku-4.5` + `openai/gpt-5.3-codex`, ignoring `ai.config.ts`.
- [ ] `L13` `isValidEmail` (`src/lib/validation.ts:2`) returns `true` for `null`/`undefined`, which is easy to misuse as "valid".
- [ ] `L14` `tests/browser.test.ts` and `tests/browser.test.nopause.ts` only navigate (and one pauses); there are no assertions and no coverage of auth, chat, content generation, or uploads.
- [ ] `L15` `.github/workflows/browser-tests.yml` starts `npm run dev &` in one step and expects it alive in the next; this is fragile, and all three browser jobs run the same single navigation test.
- [ ] `L16` `src/lib/ai-service.ts:119-183` scans `result.steps` twice for the same `open-content` payload, duplicating client tool calls. It adds duplicates if both paths match.
- [ ] `L17` `src/pages/api/files/upload.ts` and `upload-complete.ts` hardcode allowed MIME types that include `image/svg+xml`; if these are ever served inline from the same origin, SVG is an XSS vector.

## 6. Suggested remediation order (not applied)

- [ ] 1. **C3** — sanitize all Markdown/HTML before `set:html`/`innerHTML` (DOMPurify or a markdown sanitizer), including stored content.
- [ ] 2. **H1/H2** — restore the missing `/about` helpers/types and make `npm run check` green; this unblocks CI.
- [ ] 3. **H4/H6/H7/H8/H9** — authorization and input-validation fixes at the API boundary (zod schemas, ownership checks, signed upload flows).
- [ ] 4. **H10** — replace the in-memory chunk store with UploadThing's direct multipart flow or a durable store.
- [ ] 5. **H3/H5** — small, isolated UI fixes.
- [ ] 6. **H12** — declare direct deps; upgrade `astro`/`better-auth`.
- [ ] 7. Medium items, starting with DB indexes/env var and the concurrency/lost-update issues.

---
