# Brain Trials Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the central game and bounded parallel content/style work. Track steps with checkboxes.

**Goal:** Deliver a polished Chinese 15-level browser puzzle game, tested locally and prepared for GitHub Pages.

**Architecture:** Buildless HTML/CSS/JavaScript with classic deferred scripts so the game also opens directly from index.html. Pure game logic is shared between browsers and Node through a small UMD export; question data follows the same pattern. UI handles navigation and persistence without external runtime dependencies.

**Tech Stack:** HTML, CSS, JavaScript, Node built-in test runner; available browser automation for interaction QA.

**Spec:** docs/superpowers/specs/2026-10-27-brain-trials-design.md

## Global Constraints

- 15 fixed levels: three chapters, each with number, pattern, logic, memory, spatial categories.
- 45-second timed mode or untimed mode; one hint costs 30 points; correct answer 100 plus timed bonus up to 40.
- Memory observation is 5 seconds and never counts as answering time.
- Local storage with safe fallback; restored sessions paused; practice does not alter run scores.
- Local static files, no backend or external runtime requests, responsive desktop/mobile.
- Publish to the user's chosen GitHub repository and GitHub Pages, not another hosting service.

## Review Focus

- Timer expiry at submit and repeated clicks must settle at most once.
- Pausing, tab switching and reload during memory observation must not reveal the board during pause or restart its full timer.
- Corrupt or unavailable storage must not prevent gameplay.
- Practice and mode changes must not overwrite run progress or mix best scores.
- Repository subpaths, direct file opening and mobile widths must keep all assets and controls usable.

## Files and interfaces

- index.html: app shell, metadata, deferred scripts in order questions.js, engine.js, app.js.
- styles.css: responsive dark navy/orange visual system and reduced motion support.
- questions.js: global BrainQuestions and CommonJS export `{questions, categories, chapters}`. Question: `{id,category,title,prompt,hint,explanation,options:[{label,visual?}],answer,visual?,gridSize?,cells?}`; category is number/pattern/logic/memory/spatial; memory has gridSize/cells instead of options/answer. Visual values are trusted authored SVG/HTML strings.
- engine.js: global BrainEngine / CommonJS export `{createRun, currentQuestion, tick, pause, resume, beginMemory, selectAnswer, useHint, submit, next, score, restore, summarize}`. Mutable run with mode, index, phase, paused, remainingMs, observeMs, elapsedMs, selection, hinted, results, lastTick, practice. All time-dependent functions take explicit numeric `now`.
- app.js: DOM rendering, controls, safe persistence, practice queue, best records, overlays and timer updates.
- tests/engine.test.cjs, tests/questions.test.cjs: meaningful rule and independent content verification.
- scripts/serve.cjs: small local static server on loopback for preview.
- .github/workflows/pages.yml: test and deploy static files to GitHub Pages.
- README.md: usage, testing and GitHub Desktop/Pages deployment instructions.

## Task 1 Question bank and rule engine

- [x] Write tests for exactly 15 questions, expected independent puzzle solutions, memory cell bounds and all categories per chapter.
- [x] Write failing engine tests for scoring boundaries, selection validation, duplicate submit, timeout, pause/resume, memory observation, serialized restoration and full run completion.
- [x] Run `node --test tests/*.test.cjs` and observe missing implementation failures.
- [x] Implement questions.js (delegated) and engine.js (root) using the interfaces above.
- [x] Re-run the complete Node suite and resolve failures.

## Task 2 Responsive game experience

- [x] Implement index.html and styles.css (bounded delegation), using app rendering contract and coherent navy/orange geometric art direction.
- [x] Implement home, map, game and results screens in app.js; keep timers separate from full rendering so focused controls remain stable.
- [x] Implement practice outside the campaign save and separate timed/untimed best records.
- [x] Implement safe storage, invalid-save fallback, user-controlled new-run confirmation, explanation and settings dialogs, hidden-tab pause and unload save.
- [x] Verify actual browser journeys for correct/incorrect answers, hint, skip, timeout, memory, reload, both modes and 15-question completion.
- [x] Inspect desktop/mobile screenshots; fix overflow, clipped text or unusable focus targets.

## Task 3 Release and delivery

- [x] Add dependency-free npm scripts, preview server, relative asset paths, .nojekyll and Pages workflow.
- [x] Add README with local launch and GitHub publishing instructions and public-source implications.
- [x] Run the full test suite and browser smoke checks at a repository subpath.
- [x] Request fresh independent review of actual implementation, fix substantive findings, and re-run affected verification.
- [ ] Verify GitHub access and target repository before remote mutation; publish if authorized tools and destination are available, otherwise deliver ready-to-upload files and identify the exact missing setup.

## Execution notes

User has authorized implementation, so no additional planning approval is required. Workspace is a new project with no git repository or existing branch; work in D:/Project/games and prepare Git metadata only when needed. Native Sites registration is bypassed because user explicitly chose GitHub hosting. No commits or remote publication are claimed without successful tool evidence.
