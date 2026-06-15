#  Playwright + TypeScript (Page Object Model) Automation Challenge

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



## Project structure

```
playwright.config.ts        
tsconfig.json          
pages/                      #POMs
  LoginPage.ts              # OrangeHRM login 
  DashboardPage.ts          # OrangeHRM dashboard 
  PersonalDetailsPage.ts    # Personal Details
  ChatbotPage.ts            # Chatbot
tests/                      # The specs
  orangehrm.spec.ts         
  chatbot.spec.ts           
fixtures/                   # Static files used by tests 
  Flower.jpeg
  newImage.png
.github/workflows/
  ci_tests.yml              


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


## Notes on the chatbot suite

The MAZSalud site sits behind a WAF/CDN that may block CI runners and the chat widget itself
is rendered inside a cross-origin `<iframe>`, so:

- UI assertions are limited to confirming the widget's presence/visibility
  (`ChatbotPage.expectChatButtonVisible/expectChatContainerExists/forceShowChat`).
- The "send a message" scenario talks to the chatbot's HTTP API directly through Playwright's
  `request` fixture (`ChatbotPage.sendMessage`), exactly like the original spec did with
  `cy.request()`.
