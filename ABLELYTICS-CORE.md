# ABLELYTICS Core - Technical Reference

_Last updated: 2026-02-12_

## 1. Purpose

Ablelytics Core is the interaction-aware accessibility engine used in the worker, complementary to:

1. `axe-core` (rule-based engine)
2. AI heuristics checks (semantic/content checks)

Ablelytics Core focuses on WCAG checks that benefit from real browser interaction (keyboard flow, component state transitions, focus behavior), not just static DOM inspection.

## 2. Runtime Integration

Implementation files:

- `worker/helpers/ablelytics-core-tests.js`
- `worker/handlers/scanPages.js`

Execution path in worker:

1. Page is loaded in Puppeteer.
2. Axe runs.
3. Ablelytics Core runs (`new AblelyticsCoreTests(page, options).runAll()`).
4. Core issues are merged into page issues with metadata:
   - `engine: "ablelytics-core"`
   - `confidence` (0.05..0.98)
   - `needsReview` (boolean)
   - `decision` (`auto` or `review`)
5. Per-check timings are stored in `coreTiming` and logged (`[ablelytics-core][timing]`).

## 3. Default Checks Executed

Always-on checks (`runAll`):

- `checkKeyboardAccessible`
- `checkNoKeyboardTrap`
- `checkInteractiveComponentScenarios`
  - modal scenario
  - menu scenario
  - tabs scenario
  - disclosure scenario
  - carousel scenario
  - drag-drop keyboard alternative scenario
- `checkFrameworkAdapterScenarios`
- `checkAccessibilityTreeNameRoleValue`
- `checkPauseStopHide`
- `checkDraggingMovements` (currently no-op; replaced by scenario check)
- `checkBypassBlocks`
- `checkFocusOrder`
- `checkFocusVisible`
- `checkFocusNotObscured`
- `checkFocusNotObscuredEnhanced`
- `checkAudioControl`

Optional checks:

- Experimental (`includeExperimentalChecks=true`):
  - Pointer Gestures (2.5.1)
  - Pointer Cancellation (2.5.2)
  - Motion Actuation (2.5.4)
  - Concurrent Input Mechanisms (2.5.6 placeholder/no-op)
- Multi-page checks (`includeMultiPageChecks=true`):
  - Consistent Navigation (3.2.3)
  - Consistent Identification (3.2.4)
  - Consistent Help (3.2.6)

## 4. Current Worker Configuration

In `worker/handlers/scanPages.js`, Ablelytics Core is called with:

- `includeMultiPageChecks: false`
- `includeExperimentalChecks: env ENABLE_CORE_EXPERIMENTAL_HEURISTICS === "1"`
- `includeAccessibilityTreeChecks: env ENABLE_CORE_A11Y_TREE_CHECKS !== "0"` (default enabled)
- `enableVisualFocusChecks: env ENABLE_CORE_VISUAL_FOCUS_CHECKS !== "0"` (default enabled)
- `minConfidenceForAutoRaise: CORE_AUTORAISE_CONFIDENCE` (default `0.7`)
- `suppressions: CORE_SUPPRESSIONS_JSON`

## 5. Framework-Aware Behavior

The engine detects common UI frameworks and applies suppression heuristics for known false-positive patterns:

- Radix
- Headless UI
- Reach UI
- MUI
- Chakra
- Bootstrap (partially)

This reduces noise mainly for custom-role keyboard-handler warnings.

## 6. Deduplication and Capping

After checks:

1. Issues are deduplicated by `(ruleId + message + selector + html prefix)`.
2. Suppressions are applied.
3. Per-rule issue cap is enforced (`maxIssuesPerRule`, default 25).

## 7. Confidence and Decision Model

Each issue gets normalized confidence and routing:

- Base by impact:
  - critical: `0.9`
  - serious: `0.75`
  - moderate: `0.6`
  - minor: `0.4`
- +0.05 if enough evidence entries
- clamped to `[0.05, 0.98]`
- `needsReview = confidence < minConfidenceForAutoRaise`
- `decision = review|auto`

## 8. WCAG SC Coverage and Estimated False-Positive Probability

### 8.1 Enabled in current worker (default)

| WCAG SC | Coverage Source | Estimated False Positive |
|---|---|---|
| 1.4.2 Audio Control | Autoplay media without controls | 5-15% |
| 2.1.1 Keyboard | General + component interaction scenarios (menu/tabs/disclosure/carousel) | 15-40% |
| 2.1.2 No Keyboard Trap | Tab/Shift+Tab trapping + Escape escape path | 15-35% |
| 2.2.2 Pause, Stop, Hide | Legacy moving elements (`marquee`, `blink`) | 0-5% |
| 2.4.1 Bypass Blocks | Skip-link/main landmark detection + skip activation behavior | 25-45% |
| 2.4.3 Focus Order | Positive tabindex + modal/menu focus return semantics | 15-35% |
| 2.4.7 Focus Visible | CSS focus indicators + optional visual diff screenshot method | 30-50% |
| 2.4.11 Focus Not Obscured (Minimum) | Focus-point occlusion sampling (`elementFromPoint`) | 35-60% |
| 2.4.12 Focus Not Obscured (Enhanced) | Stricter occlusion sampling | 35-60% |
| 2.5.7 Dragging Movements | Draggable detection + keyboard alternative scenario | 20-40% |
| 4.1.2 Name, Role, Value | A11y tree checks + menu/tab/dialog semantics checks | 20-35% |

### 8.2 Implemented but optional/off by default

| WCAG SC | Condition | Estimated False Positive |
|---|---|---|
| 3.2.3 Consistent Navigation | Requires multi-page snapshots | 30-50% |
| 3.2.4 Consistent Identification | Requires multi-page snapshots | 30-60% |
| 3.2.6 Consistent Help | Requires multi-page snapshots | 40-70% |
| 2.5.1 Pointer Gestures | Experimental mode only | 45-75% |
| 2.5.2 Pointer Cancellation | Experimental mode only | 45-75% |
| 2.5.4 Motion Actuation | Experimental mode only | 50-80% |

## 9. Why It Is Not "Bulletproof"

Ablelytics Core is strong for automated triage, but cannot be fully false-positive-free because:

1. Many SCs are context/task dependent (intent cannot always be inferred from DOM/runtime state).
2. Dynamic apps may require app-specific interaction paths (state/setup/data) not reachable by generic probing.
3. Framework abstractions can hide behavior from simple DOM/event heuristics.
4. Visual checks (focus visible/obscured) depend on viewport, overlays, timing, and CSS transitions.
5. Multi-page consistency SCs require representative page sets and page-type classification.

## 10. What Is Already "Strong"

Most reliable checks today:

- 2.2.2 (`marquee`/`blink`) - almost deterministic
- 1.4.2 autoplay without controls - relatively deterministic
- High-confidence 2.1.1 failures where elements are clearly clickable but not focusable
- Some 4.1.2 failures from accessibility tree missing names

## 11. Known Limitations per SC (high level)

- 2.4.7 / 2.4.11 / 2.4.12: still heuristic despite visual sampling.
- 2.4.1: skip-link quality and real bypass effectiveness vary by implementation.
- 2.1.2: trap detection can be affected by intentional focus traps in modals.
- 4.1.2: role/state synchronization can be app-architecture specific.

## 12. Performance and Timing

Core records timing per check in `coreTiming.checks[]`, including:

- check name
- durationMs
- issue count
- check error (if any)

This is emitted in worker logs and stored in scan docs. Use this to track regression in runtime cost over time.

## 13. Practical Interpretation Guidance

Use this triage policy:

1. Treat `decision=auto` with higher trust, but still validate before customer-facing reporting.
2. Prioritize `needsReview=true` issues for human confirmation.
3. For high-noise SCs (2.4.7, 2.4.11, 2.4.12, 3.2.x), label as "Potential" unless confirmed.
4. Combine signals across engines (Axe + Ablelytics + AI) before escalating severity.

## 14. Recommended Next Improvements

Highest ROI improvements:

1. Add per-component scenario library (menu/dialog/tabs/combobox/treegrid variants).
2. Add app-specific scripted journeys (auth, filters, drawers, routing transitions).
3. Capture per-step screenshots for focus checks to reduce uncertainty.
4. Add historical calibration (confirmed true/false labels -> confidence tuning per SC).
5. Enable optional multi-page checks only in report mode with selected representative page sets.

---

If needed, this file can be split into:

- `ABLELYTICS-CORE-ARCHITECTURE.md`
- `ABLELYTICS-CORE-SC-MATRIX.md`
- `ABLELYTICS-CORE-TUNING.md`

for easier maintenance.
