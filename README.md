# PruebaQA_Artificial_Nerds — Playwright + TypeScript (Page Object Model)

End-to-end automation suite for **OrangeHRM** (PIM / login / personal details / attachments /
logout) and the **MAZSalud chatbot** widget, migrated from **Cypress + JavaScript** to
**Playwright + TypeScript**, organized as a **Page Object Model (POM)**.

## Why this project moved from Cypress to Playwright

The original suite worked, but two recurring pain points drove the migration:

1. **Cross-origin limitations.** The chatbot widget lives inside a cross-origin `<iframe>`.
   Cypress cannot drive or even reliably inspect cross-origin frames, which is why the original
   `ChatbotQA.cy.js` could only assert that the iframe *existed* and had to fall back to a raw
   `cy.request()` to exercise the chat through its HTTP API. Playwright has first-class support
   for frames (`frameLocator`) and a real multi-tab/multi-origin browser automation model, which
   removes that ceiling for future test growth.
2. **Browser coverage and parallelism.** Cypress runs one browser/tab per spec and its
   cross-browser story (Firefox/WebKit) is comparatively limited. Playwright ships a single API
   that drives Chromium, Firefox and WebKit, runs specs in parallel workers out of the box, and
   has built-in tracing/video/screenshot capture on failure — all of which simplified the CI setup
   (see `.github/workflows/ci_tests.yml`).

Additional reasons that tipped the scale:

| Topic | Cypress | Playwright |
|---|---|---|
| Language | JavaScript (typings via `cypress` globals) | **TypeScript-first**, full editor autocompletion on the `Page`/`Locator` API |
| Async model | Custom command-queue/chaining (`cy.get().should()...`) that hides Promises | Native `async`/`await`, plain Promises — easier to compose into Page Objects and helper classes |
| Auto-waiting | Built-in, but scoped to its command queue | Built-in **actionability checks** (`visible`, `stable`, `enabled`, receives events) baked into every action and into `expect(locator)` assertions |
| API testing | `cy.request()` (shares the browser's network stack) | Dedicated `request` fixture (`APIRequestContext`) that is independent from the browser — used here for the chatbot "send message" scenario |
| Reporting | JUnit reporter via plugin/CLI flags | Built-in HTML, JUnit, list, dot, and JSON reporters configured declaratively in `playwright.config.ts` |
| Test isolation | Shared browser/tab across a spec; manual `cy.clearCookies()/clearLocalStorage()` | Each test gets a brand-new, isolated `BrowserContext` automatically |
| File uploads / network mocking | Required the `cypress-file-upload` plugin | Native `locator.setInputFiles()` and `page.route()` |

In short: Playwright's native TypeScript support, frame/iframe handling, parallel execution and
batteries-included tooling (trace viewer, HTML reports, codegen) made it a better long-term fit
for this suite, especially given the chatbot scenario's cross-origin constraints.

## Project structure

```
playwright.config.ts        # Browsers, projects, reporters, timeouts, launch args
tsconfig.json               # Strict TypeScript configuration
pages/                      # Page Object Model classes
  LoginPage.ts              # OrangeHRM login screen
  DashboardPage.ts          # OrangeHRM dashboard landing screen
  PersonalDetailsPage.ts    # PIM "Personal Details" form, Custom Fields, Attachments, logout
  ChatbotPage.ts            # MAZSalud chatbot widget + HTTP API helper
tests/                      # Test specs (one `describe` per original Cypress spec)
  orangehrm.spec.ts         # Former cypress/e2e/pruebaQA.cy.js
  chatbot.spec.ts           # Former cypress/e2e/ChatbotQA.cy.js
fixtures/                   # Static files used by tests (former cypress/fixtures)
  flordeprueba.jpeg
  nuevaImagen.png
.github/workflows/
  ci_tests.yml              # GitHub Actions pipeline (Playwright + JUnit)
```

## Migration decisions

- **Page Object Model.** All locators and screen-specific actions were extracted from the spec
  files into dedicated classes under `pages/`. Tests now read as a sequence of business actions
  (`loginPage.login(...)`, `personalDetailsPage.fillName(...)`, `personalDetailsPage.save()`)
  instead of chains of raw selectors — the same readability goal the original spec's inline
  comments were trying to achieve, but enforced structurally and reusable across specs.
- **Same test cases & assertions.** Every `it(...)` from both original specs has a 1:1
  counterpart `test(...)`: *Log in incorrecto*, *Log in correcto*, *Acceder a My Info*,
  *Agregar y guardar Personal Details*, *Custom Fields*, *Gestión de imágenes (Attachments)*,
  *Cerrar sesión* (OrangeHRM) and *Acceder a la URL*, *Encontrar el botón del chatbot*,
  *Abrir el chatbot visualmente*, *Escribir "Hola" (simulado por cross-origin)*,
  *Enviar "Hola" vía API y validar respuesta* (Chatbot).
- **Cypress command → Playwright equivalent mapping**, applied throughout:
  - `cy.visit(url)` → `page.goto(url)`
  - `cy.get(selector).should('be.visible')` → `expect(locator).toBeVisible()`
  - `cy.contains(text)` / `.parents().find()` → `page.getByText()`, `locator.filter({ hasText })`,
    XPath `ancestor::` locators
  - `.type(text)` / `.clear()` → `locator.fill(text)` / `locator.clear()`
  - `.check({ force: true })` → `locator.check({ force: true })`
  - `.selectFile(path)` (via `cypress-file-upload`) → `locator.setInputFiles(path)` (native)
  - `cy.request()` → the `request` fixture (`APIRequestContext`)
  - `cy.clearCookies()/clearLocalStorage()` → relied on Playwright's per-test isolated
    `BrowserContext`, with an explicit `context.clearCookies()` kept in `beforeEach` for parity
  - `Cypress.on('uncaught:exception', ...)` → not needed; Playwright does not fail tests on
    page-level uncaught exceptions by default
- **Custom Chrome launch flags preserved.** The `--disable-blink-features=AutomationControlled`
  flag and the Spanish (`es-ES`) locale/user agent from `cypress.config.js`'s
  `before:browser:launch` hook were ported into `playwright.config.ts` (`launchOptions.args`,
  `use.locale`, `use.userAgent`).
- **JUnit reporting kept for CI.** `playwright.config.ts` configures the built-in `junit`
  reporter to write to `reports/junit-results.xml` (same path/convention the GitHub Actions
  workflow already expected), plus the `html` reporter for local debugging via traces,
  screenshots and videos on failure.
- **TypeScript throughout.** All `.cy.js` specs and support files were rewritten as `.ts` with
  explicit interfaces (e.g. `NameDetails`, `ChatbotApiBody`) and typed Playwright fixtures
  (`Page`, `Locator`, `APIRequestContext`), checked via `npm run typecheck` (`tsc --noEmit`).

## Requirements

- Node.js 18+ (recommended 20)
- Git

## Install

```bash
npm ci || npm install
npx playwright install --with-deps chromium
```

## Run the tests

```bash
# Run everything (both projects: orangehrm + chatbot)
npm test

# Run with a visible browser
npm run test:headed

# Open Playwright's interactive UI mode
npm run test:ui

# Run a single suite
npm run test:orangehrm
npm run test:chatbot

# Open the last HTML report
npm run report

# Type-check the project without running tests
npm run typecheck
```

## CI pipeline (GitHub Actions)

The workflow lives in `.github/workflows/ci_tests.yml` and runs automatically when:

- You push to the `main` branch
- You open a Pull Request targeting `main`
- You trigger it manually from the **Actions** tab (`workflow_dispatch`)

It installs dependencies, installs the Chromium browser binaries, runs `npm test`
(Playwright with the `junit` + `html` reporters), and uploads:

- `junit-results` — JUnit XML report (consumed by `dorny/test-reporter` for PR checks)
- `playwright-artifacts` — HTML report, traces, screenshots and videos for failed runs

## Notes on the OrangeHRM suite

`opensource-demo.orangehrmlive.com` is a public, shared demo instance — every visitor reuses the
same `Admin` account and the same employee records, so its data drifts over time as other people
run their own scripts and manual tests against it. One assertion inherited from the original spec
is sensitive to this:

- **"Cerrar sesion"** asserts that after renaming employee #7 to "John Michael Smith", the
  top-bar user dropdown shows `John Smith` (`cy.contains('p.oxd-userdropdown-name', 'John Smith', …)`
  in the original Cypress test). That only holds when employee #7 *is* the employee record linked
  to the logged-in `Admin` account — i.e., editing "your own" Personal Details changes your own
  displayed name. On the current shared instance, `Admin`'s linked employee is named "Orange Test",
  so the dropdown keeps showing that name no matter what employee #7's record says, and the
  assertion fails. This is a pre-existing assumption baked into the original spec about the shared
  demo's state, not a regression introduced by the migration — the assertion was kept unchanged
  to honor "keep the same test cases and assertions", and the failure reproduces identically
  whether driven by Cypress or Playwright.

## Notes on the chatbot suite

The MAZSalud site sits behind a WAF/CDN that may block CI runners and the chat widget itself
is rendered inside a cross-origin `<iframe>`, so:

- UI assertions are limited to confirming the widget's presence/visibility
  (`ChatbotPage.expectChatButtonVisible/expectChatContainerExists/forceShowChat`).
- The "send a message" scenario talks to the chatbot's HTTP API directly through Playwright's
  `request` fixture (`ChatbotPage.sendMessage`), exactly like the original spec did with
  `cy.request()`.
