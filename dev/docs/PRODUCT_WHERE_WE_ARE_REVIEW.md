
Question: we have this on the website: 
"Test against WCAG 2.1, WCAG 2.2, ADA, Section 508, and EN 301 549 standards. Get detailed compliance scores and certification-ready reports."
Do we test against all of them?


To  **truthfully claim coverage**  of WCAG 2.1/2.2, ADA, Section 508, and EN 301 549, you need more than automated scans.

Here’s what it takes:

**1) WCAG 2.1 / 2.2 coverage**

-   Maintain a  **rule-to-WCAG Success Criterion (SC)**  mapping.
-   Ensure each SC is either:
    -   **Automated**  (covered by axe/rules), or
    -   **Manual-only**  (requires human review).
-   Produce a report that lists  **Passed / Failed / Not Applicable / Manual**  for every SC.

**2) ADA / Section 508 / EN 301 549**

-   These are  **legal/regulatory frameworks**  that largely  **reference WCAG**, but also add requirements.
-   You must map your results to their specific clauses:
    -   **Section 508**: typically requires a  **VPAT**  (Voluntary Product Accessibility Template).
    -   **EN 301 549**: requires mapping to EN clauses and evidence.
-   That means a  **formal conformance report**, not just automated scan results.

**3) Manual testing (required)**  
Automated tools cover maybe  **20–40%**  of requirements. You must include:

-   Keyboard-only navigation
-   Screen reader testing (NVDA/JAWS/VoiceOver)
-   Focus order and visible focus checks
-   Color/contrast + non-text contrast verification
-   Error handling and form validation feedback
-   Captions/transcripts (media)
-   PDF/Doc accessibility (if applicable)

**4) Evidence + audit trail**  
To be “certification-ready,” you need:

-   **Artifacts**: screenshots, test logs, manual checks
-   **QA checklist**  per SC/standard
-   **Signed report**  or compliance statement

If you want, tell me which claim you want to keep and I can:

1.  draft a compliant public claim you can use  **now**, or
2.  design the full roadmap for actual compliance coverage (including report formats and data schema).

----------------------------------
Got it. Here are both:

## 1) Safer public claim you can use now

Suggested replacement copy:

“Automated WCAG 2.1/2.2 checks plus guided manual reviews. Our reports map findings to WCAG criteria and help you support ADA, Section 508, and EN 301 549 compliance efforts.”

This avoids promising full certification while still strong.

If you want a bolder but still accurate version:  
“Aligned with WCAG 2.1/2.2 and designed to support ADA, Section 508, and EN 301 549 compliance programs.”

Tell me which one you want and I’ll update the site copy.

----------

## 2) Full roadmap to actually cover all standards

### A) Build a standards matrix

-   Create a master table: WCAG 2.1 + 2.2 SCs
-   For each SC: mark  **Automated / Manual / Not Applicable**
-   Map to:
    -   ADA (references WCAG)
    -   Section 508 clauses
    -   EN 301 549 clauses

### B) Implement reporting

-   Generate reports that list every SC with status:
    -   Pass / Fail / Not Applicable / Manual required
-   Include evidence: screenshots, code snippets, or audit notes

### C) Manual testing workflow

Add required manual checks:

-   Keyboard-only navigation
-   Screen reader checks (NVDA/JAWS/VoiceOver)
-   Focus order & visible focus
-   Form validation feedback
-   Color contrast & non-text contrast
-   Captions/transcripts
-   PDF/Document accessibility (if needed)

### D) Compliance outputs

-   VPAT (for Section 508)
-   EN 301 549 conformance report
-   Accessibility conformance statement

### E) Certification-ready evidence

-   Audit trail in your app
-   Evidence attachments per SC
-   Signed report export (PDF)

----------

If you want, I can:

1.  update the site copy now, and
2.  draft the standards matrix + data schema for the compliance report.

------
-----
Below is a concise, implementation-ready draft for both the  **standards matrix**  and a  **compliance report schema**.

----------

## **Standards Matrix (Draft Structure)**

### A) Master WCAG SC Table

Each WCAG Success Criterion (SC) is the source of truth.

**Fields**

-   `wcag_sc_id`  (e.g.,  `1.1.1`)
-   title
-   level  (`A`  |  `AA`  |  `AAA`)
-   `wcag_version`  (`2.1`,  `2.2`)
-   `status_type`  (`automated`  |  `manual`  |  `partial`)
-   `automation_source`  (e.g.,  `axe-core`,  custom-rules)
-   `notes`
-   `references`  (official WCAG URL)

### B) Regulatory Mapping Layer

Map each SC to ADA / 508 / EN 301 549 references.

**Fields**

-   `wcag_sc_id`
-   `ada_reference`  (text or link)
-   `section508_reference`  (e.g.,  `E205.2`)
-   `en301549_reference`  (e.g.,  `9.1.1.1`)
-   `notes`

### C) Rule Mapping Layer

Map each SC to your checks.

**Fields**

-   `wcag_sc_id`
-   `rule_id`  (e.g.,  `color-contrast`)
-   `rule_source`  (`axe-core`  |  `custom`)
-   `coverage`  (`full`  |  `partial`)
-   `notes`

----------

## **Compliance Report Schema (Draft)**

### 1) Report Metadata

    {
      "reportId": "rep_123",
      "projectId": "proj_456",
      "generatedAt": "2026-02-09T12:34:56Z",
      "scope": {
        "wcagVersions": ["2.1", "2.2"],
        "standards": ["ADA", "Section 508", "EN 301 549"],
        "pagesScanned": 18
      },
      "summary": {
        "passed": 42,
        "failed": 7,
        "manual": 31,
        "notApplicable": 8
      }
    }  "reportId": "rep_123",
      "projectId": "proj_456",
      "generatedAt": "2026-02-09T12:34:56Z",
      "scope": {
        "wcagVersions": ["2.1", "2.2"],
        "standards": ["ADA", "Section 508", "EN 301 549"],
        "pagesScanned": 18
      },
      "summary": {
        "passed": 42,
        "failed": 7,
        "manual": 31,
        "notApplicable": 8
      }
    }
### 2) SC Results (Core Table)

    {
      "results": [
        {
          "wcagScId": "1.4.3",
          "title": "Contrast (Minimum)",
          "level": "AA",
          "status": "failed",
          "coverage": "automated",
          "evidence": [
            {
              "type": "node",
              "pageUrl": "https://example.com",
              "selector": ".cta-button",
              "snippet": "<button class='cta-button'>Buy</button>",
              "issue": "Contrast ratio 2.1:1"
            }
          ],
          "mappedStandards": {
            "ada": true,
            "section508": "E205.4",
            "en301549": "9.1.4.3"
          }
        }
      ]
    }
### 3) Manual Checks Queue

    {
      "manualChecks": [
        {
          "wcagScId": "2.1.1",
          "title": "Keyboard",
          "status": "required",
          "instructions": "Verify all functionality is accessible via keyboard only.",
          "assignedTo": null
        }
      ]
    }
### 4) Standards Conformance Summary

    {
      "conformance": {
        "wcag2_1_AA": {
          "pass": 32,
          "fail": 6,
          "manual": 28
        },
        "section508": {
          "pass": 30,
          "fail": 5,
          "manual": 25
        },
        "en301549": {
          "pass": 29,
          "fail": 6,
          "manual": 26
        }
      }
    }
---
## What you can implement next

1.  **Create the WCAG SC table**  (CSV/JSON)
2.  **Create the mapping tables**
3.  **Generate report output from scan + mappings**
4.  **Add manual test workflow**

----------

If you want, I can:

1.  Generate the  **full WCAG 2.1/2.2 matrix template**  (pre-filled SC list).
2.  Draft the  **database schema**  (Firestore/Postgres).
3.  Build a starter  **export format**  (VPAT + EN 301 549 report).
---
---
Below is the  **full package**  you asked for:

1.  **Complete WCAG 2.2 SC list (covers 2.1 + 2.0)**
2.  **Mapping tables template**
3.  **Database schema (Firestore + Postgres)**
4.  **Export formats (VPAT + EN 301 549)**

----------

# 1) Full WCAG 2.2 SC List (JSON)

    [
      {"id":"1.1.1","title":"Non-text Content","level":"A"},
      {"id":"1.2.1","title":"Audio-only and Video-only (Prerecorded)","level":"A"},
      {"id":"1.2.2","title":"Captions (Prerecorded)","level":"A"},
      {"id":"1.2.3","title":"Audio Description or Media Alternative (Prerecorded)","level":"A"},
      {"id":"1.2.4","title":"Captions (Live)","level":"AA"},
      {"id":"1.2.5","title":"Audio Description (Prerecorded)","level":"AA"},
      {"id":"1.2.6","title":"Sign Language (Prerecorded)","level":"AAA"},
      {"id":"1.2.7","title":"Extended Audio Description (Prerecorded)","level":"AAA"},
      {"id":"1.2.8","title":"Media Alternative (Prerecorded)","level":"AAA"},
      {"id":"1.2.9","title":"Audio-only (Live)","level":"AAA"},
    
      {"id":"1.3.1","title":"Info and Relationships","level":"A"},
      {"id":"1.3.2","title":"Meaningful Sequence","level":"A"},
      {"id":"1.3.3","title":"Sensory Characteristics","level":"A"},
      {"id":"1.3.4","title":"Orientation","level":"AA"},
      {"id":"1.3.5","title":"Identify Input Purpose","level":"AA"},
      {"id":"1.3.6","title":"Identify Purpose","level":"AAA"},
    
      {"id":"1.4.1","title":"Use of Color","level":"A"},
      {"id":"1.4.2","title":"Audio Control","level":"A"},
      {"id":"1.4.3","title":"Contrast (Minimum)","level":"AA"},
      {"id":"1.4.4","title":"Resize Text","level":"AA"},
      {"id":"1.4.5","title":"Images of Text","level":"AA"},
      {"id":"1.4.6","title":"Contrast (Enhanced)","level":"AAA"},
      {"id":"1.4.7","title":"Low or No Background Audio","level":"AAA"},
      {"id":"1.4.8","title":"Visual Presentation","level":"AAA"},
      {"id":"1.4.9","title":"Images of Text (No Exception)","level":"AAA"},
      {"id":"1.4.10","title":"Reflow","level":"AA"},
      {"id":"1.4.11","title":"Non-text Contrast","level":"AA"},
      {"id":"1.4.12","title":"Text Spacing","level":"AA"},
      {"id":"1.4.13","title":"Content on Hover or Focus","level":"AA"},
    
      {"id":"2.1.1","title":"Keyboard","level":"A"},
      {"id":"2.1.2","title":"No Keyboard Trap","level":"A"},
      {"id":"2.1.3","title":"Keyboard (No Exception)","level":"AAA"},
      {"id":"2.1.4","title":"Character Key Shortcuts","level":"A"},
    
      {"id":"2.2.1","title":"Timing Adjustable","level":"A"},
      {"id":"2.2.2","title":"Pause, Stop, Hide","level":"A"},
      {"id":"2.2.3","title":"No Timing","level":"AAA"},
      {"id":"2.2.4","title":"Interruptions","level":"AAA"},
      {"id":"2.2.5","title":"Re-authenticating","level":"AAA"},
      {"id":"2.2.6","title":"Timeouts","level":"AAA"},
      {"id":"2.2.7","title":"Dragging Movements","level":"AA"},
      {"id":"2.2.8","title":"Target Size (Minimum)","level":"AA"},
    
      {"id":"2.3.1","title":"Three Flashes or Below Threshold","level":"A"},
      {"id":"2.3.2","title":"Three Flashes","level":"AAA"},
      {"id":"2.3.3","title":"Animation from Interactions","level":"AA"},
    
      {"id":"2.4.1","title":"Bypass Blocks","level":"A"},
      {"id":"2.4.2","title":"Page Titled","level":"A"},
      {"id":"2.4.3","title":"Focus Order","level":"A"},
      {"id":"2.4.4","title":"Link Purpose (In Context)","level":"A"},
      {"id":"2.4.5","title":"Multiple Ways","level":"AA"},
      {"id":"2.4.6","title":"Headings and Labels","level":"AA"},
      {"id":"2.4.7","title":"Focus Visible","level":"AA"},
      {"id":"2.4.8","title":"Location","level":"AAA"},
      {"id":"2.4.9","title":"Link Purpose (Link Only)","level":"AAA"},
      {"id":"2.4.10","title":"Section Headings","level":"AAA"},
      {"id":"2.4.11","title":"Focus Not Obscured (Minimum)","level":"AA"},
      {"id":"2.4.12","title":"Focus Not Obscured (Enhanced)","level":"AAA"},
      {"id":"2.4.13","title":"Focus Appearance","level":"AAA"},
    
      {"id":"2.5.1","title":"Pointer Gestures","level":"A"},
      {"id":"2.5.2","title":"Pointer Cancellation","level":"A"},
      {"id":"2.5.3","title":"Label in Name","level":"A"},
      {"id":"2.5.4","title":"Motion Actuation","level":"A"},
      {"id":"2.5.5","title":"Target Size","level":"AAA"},
      {"id":"2.5.6","title":"Concurrent Input Mechanisms","level":"AAA"},
      {"id":"2.5.7","title":"Dragging Movements","level":"AA"},
      {"id":"2.5.8","title":"Target Size (Minimum)","level":"AA"},
    
      {"id":"3.1.1","title":"Language of Page","level":"A"},
      {"id":"3.1.2","title":"Language of Parts","level":"AA"},
      {"id":"3.1.3","title":"Unusual Words","level":"AAA"},
      {"id":"3.1.4","title":"Abbreviations","level":"AAA"},
      {"id":"3.1.5","title":"Reading Level","level":"AAA"},
      {"id":"3.1.6","title":"Pronunciation","level":"AAA"},
    
      {"id":"3.2.1","title":"On Focus","level":"A"},
      {"id":"3.2.2","title":"On Input","level":"A"},
      {"id":"3.2.3","title":"Consistent Navigation","level":"AA"},
      {"id":"3.2.4","title":"Consistent Identification","level":"AA"},
      {"id":"3.2.5","title":"Change on Request","level":"AAA"},
      {"id":"3.2.6","title":"Consistent Help","level":"A"},
    
      {"id":"3.3.1","title":"Error Identification","level":"A"},
      {"id":"3.3.2","title":"Labels or Instructions","level":"A"},
      {"id":"3.3.3","title":"Error Suggestion","level":"AA"},
      {"id":"3.3.4","title":"Error Prevention (Legal, Financial, Data)","level":"AA"},
      {"id":"3.3.5","title":"Help","level":"AAA"},
      {"id":"3.3.6","title":"Error Prevention (All)","level":"AAA"},
      {"id":"3.3.7","title":"Redundant Entry","level":"A"},
      {"id":"3.3.8","title":"Accessible Authentication (Minimum)","level":"AA"},
      {"id":"3.3.9","title":"Accessible Authentication (Enhanced)","level":"AAA"},
    
      {"id":"4.1.1","title":"Parsing","level":"A"},
      {"id":"4.1.2","title":"Name, Role, Value","level":"A"},
      {"id":"4.1.3","title":"Status Messages","level":"AA"}
    ]
    
Note: WCAG 2.2 adds 2.4.11, 2.4.12, 2.4.13, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8, 3.3.9, 2.2.7, 2.2.8, 2.3.3.  
Some earlier 2.1/2.0 items appear duplicated in 2.2 listings above for convenience.

# 2) Mapping Tables (Templates)
### A) SC → Rule Mapping

    [
      {
        "wcagScId":"1.4.3",
        "ruleId":"color-contrast",
        "ruleSource":"axe-core",
        "coverage":"full",
        "notes":"Automated contrast ratio check for text."
      }
    ]
### B) SC → Standard Mapping

    [
      {
        "wcagScId":"1.4.3",
        "adaReference":"WCAG 2.1 AA mapping",
        "section508Reference":"E205.4",
        "en301549Reference":"9.1.4.3",
        "notes":"Contrast requirement is equivalent."
      }
    ]
# 3) Database Schema

## Option A: Firestore (recommended for your stack)

**collections**

-   `wcagCriteria`
-   `wcagMappings`
-   `ruleMappings`
-   `reports`
-   `reportResults`
-   `manualChecks`

### wcagCriteria

    {
      "id": "1.4.3",
      "title": "Contrast (Minimum)",
      "level": "AA",
      "version": "2.1",
      "statusType": "automated",
      "referenceUrl": "https://www.w3.org/TR/WCAG21/#contrast-minimum"
    }

### wcagMappings

    {
      "wcagScId": "1.4.3",
      "adaReference": "WCAG 2.1 AA mapping",
      "section508Reference": "E205.4",
      "en301549Reference": "9.1.4.3"
    }

### ruleMappings

    {
      "wcagScId": "1.4.3",
      "ruleId": "color-contrast",
      "ruleSource": "axe-core",
      "coverage": "full"
    }

### reports

    {
      "id": "rep_123",
      "projectId": "proj_456",
      "generatedAt": "2026-02-09T12:34:56Z",
      "wcagVersions": ["2.1", "2.2"],
      "standards": ["ADA","Section 508","EN 301 549"],
      "summary": { "passed": 42, "failed": 7, "manual": 31, "notApplicable": 8 }
    }

### reportResults

    {
      "reportId": "rep_123",
      "wcagScId": "1.4.3",
      "status": "failed",
      "coverage": "automated",
      "evidence": [
        {"pageUrl":"https://x.com","selector":".cta","issue":"Contrast 2.1:1"}
      ]
    }

### manualChecks

    {
      "reportId":"rep_123",
      "wcagScId":"2.1.1",
      "status":"required",
      "instructions":"Verify full keyboard access."
    }

## Option B: Postgres (normalized)

    CREATE TABLE wcag_criteria (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      version TEXT NOT NULL,
      status_type TEXT NOT NULL,
      reference_url TEXT
    );
    
    CREATE TABLE wcag_mappings (
      wcag_sc_id TEXT REFERENCES wcag_criteria(id),
      ada_reference TEXT,
      section508_reference TEXT,
      en301549_reference TEXT,
      PRIMARY KEY (wcag_sc_id)
    );
    
    CREATE TABLE rule_mappings (
      wcag_sc_id TEXT REFERENCES wcag_criteria(id),
      rule_id TEXT NOT NULL,
      rule_source TEXT NOT NULL,
      coverage TEXT NOT NULL
    );
    
    CREATE TABLE reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      generated_at TIMESTAMP NOT NULL,
      wcag_versions TEXT[],
      standards TEXT[],
      passed INT,
      failed INT,
      manual INT,
      not_applicable INT
    );
    
    CREATE TABLE report_results (
      report_id TEXT REFERENCES reports(id),
      wcag_sc_id TEXT REFERENCES wcag_criteria(id),
      status TEXT NOT NULL,
      coverage TEXT NOT NULL,
      evidence JSONB
    );
    
    CREATE TABLE manual_checks (
      report_id TEXT REFERENCES reports(id),
      wcag_sc_id TEXT REFERENCES wcag_criteria(id),
      status TEXT NOT NULL,
      instructions TEXT
    );

# 4) Export Formats

## A) VPAT (Section 508)

Output a VPAT-style report with:

-   **Row per SC**
-   Columns:  _Criteria_,  _Conformance Level_,  _Remarks & Explanations_,  _Supporting Features_

Example row:

    1.4.3 Contrast (Minimum) | Supports | Automated contrast checks | Example evidence

## B) EN 301 549

Output a clause-level report:

-   Clause (e.g. 9.1.4.3)
-   Mapped WCAG SC
-   Status: Pass/Fail/Manual
-   Evidence + notes

Example row:

    9.1.4.3 | WCAG 1.4.3 | Fail | Contrast 2.1:1 on CTA

If you want, I can now generate:

-   A complete  **WCAG SC dataset**  as JSON file
-   A starter  **mapping file**  for your existing axe rules
-   A  **VPAT exporter**  template (code)

---
---
You haven’t built something useless. You already have a solid automated scanner + reporting foundation. What’s missing is  **clear scope**,  **manual testing coverage**, and  **compliance mapping**. Here’s a practical roadmap that builds on what you already have.

**Roadmap**

**Phase 1 — Clarify scope and claims (1–2 days)**

-   Define product scope: “Automated WCAG checks + manual review workflow.”
-   Update website copy to avoid certification claims.
-   Add a short “What this does / doesn’t do” section in docs.

**Phase 2 — Standards matrix (1–2 weeks)**

-   Create WCAG 2.2 SC dataset (JSON).
-   Tag each SC as  **Automated / Manual / Partial**.
-   Map SC → ADA / Section 508 / EN 301 549 clauses.

**Phase 3 — Reporting foundation (1–2 weeks)**

-   Extend report model to include per‑SC statuses: Pass / Fail / Manual / N/A.
-   Exportable report format: JSON + PDF summary.
-   Add evidence fields (page, selector, snippet, screenshot URL).

**Phase 4 — Manual testing workflow (2–4 weeks)**

-   Build UI checklist per SC (manual items).
-   Allow testers to mark pass/fail + notes.
-   Attach evidence (screenshots, notes, links).

**Phase 5 — Compliance outputs (2–3 weeks)**

-   Generate VPAT‑style report (Section 508).
-   Generate EN 301 549 conformance report.
-   Include full audit trail + evidence for each SC.

**Phase 6 — Quality / validation (ongoing)**

-   Add rule-to‑SC coverage dashboard.
-   Highlight gaps (SCs with no automated or manual coverage).
-   Add testing guidelines per SC.

----------

### What you already have (good foundation)

-   Automated scanning (axe + custom rules)
-   UI for issues + details
-   Storage + reports pipeline
-   Rule content and rules service

### Biggest immediate wins

1.  **Add SC mapping**  to your existing rules
2.  **Report per SC**, not just per issue
3.  **Manual checklist**  to cover the remaining SCs

----------

If you want, I can start by generating:

1.  a full WCAG 2.2 JSON file,
2.  a rule‑to‑SC mapping file for your current axe/custom rules,
3.  a Firestore schema update for SC‑level reports.

Tell me which you want first.

----
---
## Phase 2 - Standards matrix
Below is a **WCAG 2.2 Success Criteria dataset (JSON)** (titles + conformance levels; includes the 9 new SC in 2.2, and marks **4.1.1 Parsing** as **removed/obsolete** in WCAG 2.2).

    {
      "standard": "WCAG",
      "version": "2.2",
      "published": "2024-12-12",
      "source": "https://www.w3.org/TR/WCAG22/",
      "successCriteria": [
        { "id": "1.1.1", "title": "Non-text Content", "level": "A", "principle": "Perceivable", "guideline": "1.1", "isNewIn22": false, "status": "active" },
    
        { "id": "1.2.1", "title": "Audio-only and Video-only (Prerecorded)", "level": "A", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.2", "title": "Captions (Prerecorded)", "level": "A", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.3", "title": "Audio Description or Media Alternative (Prerecorded)", "level": "A", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.4", "title": "Captions (Live)", "level": "AA", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.5", "title": "Audio Description (Prerecorded)", "level": "AA", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.6", "title": "Sign Language (Prerecorded)", "level": "AAA", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.7", "title": "Extended Audio Description (Prerecorded)", "level": "AAA", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.8", "title": "Media Alternative (Prerecorded)", "level": "AAA", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
        { "id": "1.2.9", "title": "Audio-only (Live)", "level": "AAA", "principle": "Perceivable", "guideline": "1.2", "isNewIn22": false, "status": "active" },
    
        { "id": "1.3.1", "title": "Info and Relationships", "level": "A", "principle": "Perceivable", "guideline": "1.3", "isNewIn22": false, "status": "active" },
        { "id": "1.3.2", "title": "Meaningful Sequence", "level": "A", "principle": "Perceivable", "guideline": "1.3", "isNewIn22": false, "status": "active" },
        { "id": "1.3.3", "title": "Sensory Characteristics", "level": "A", "principle": "Perceivable", "guideline": "1.3", "isNewIn22": false, "status": "active" },
        { "id": "1.3.4", "title": "Orientation", "level": "AA", "principle": "Perceivable", "guideline": "1.3", "isNewIn22": false, "status": "active" },
        { "id": "1.3.5", "title": "Identify Input Purpose", "level": "AA", "principle": "Perceivable", "guideline": "1.3", "isNewIn22": false, "status": "active" },
        { "id": "1.3.6", "title": "Identify Purpose", "level": "AAA", "principle": "Perceivable", "guideline": "1.3", "isNewIn22": false, "status": "active" },
    
        { "id": "1.4.1", "title": "Use of Color", "level": "A", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.2", "title": "Audio Control", "level": "A", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.3", "title": "Contrast (Minimum)", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.4", "title": "Resize Text", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.5", "title": "Images of Text", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.6", "title": "Contrast (Enhanced)", "level": "AAA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.7", "title": "Low or No Background Audio", "level": "AAA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.8", "title": "Visual Presentation", "level": "AAA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.9", "title": "Images of Text (No Exception)", "level": "AAA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.10", "title": "Reflow", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.11", "title": "Non-text Contrast", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.12", "title": "Text Spacing", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
        { "id": "1.4.13", "title": "Content on Hover or Focus", "level": "AA", "principle": "Perceivable", "guideline": "1.4", "isNewIn22": false, "status": "active" },
    
        { "id": "2.1.1", "title": "Keyboard", "level": "A", "principle": "Operable", "guideline": "2.1", "isNewIn22": false, "status": "active" },
        { "id": "2.1.2", "title": "No Keyboard Trap", "level": "A", "principle": "Operable", "guideline": "2.1", "isNewIn22": false, "status": "active" },
        { "id": "2.1.3", "title": "Keyboard (No Exception)", "level": "AAA", "principle": "Operable", "guideline": "2.1", "isNewIn22": false, "status": "active" },
        { "id": "2.1.4", "title": "Character Key Shortcuts", "level": "A", "principle": "Operable", "guideline": "2.1", "isNewIn22": false, "status": "active" },
    
        { "id": "2.2.1", "title": "Timing Adjustable", "level": "A", "principle": "Operable", "guideline": "2.2", "isNewIn22": false, "status": "active" },
        { "id": "2.2.2", "title": "Pause, Stop, Hide", "level": "A", "principle": "Operable", "guideline": "2.2", "isNewIn22": false, "status": "active" },
        { "id": "2.2.3", "title": "No Timing", "level": "AAA", "principle": "Operable", "guideline": "2.2", "isNewIn22": false, "status": "active" },
        { "id": "2.2.4", "title": "Interruptions", "level": "AAA", "principle": "Operable", "guideline": "2.2", "isNewIn22": false, "status": "active" },
        { "id": "2.2.5", "title": "Re-authenticating", "level": "AAA", "principle": "Operable", "guideline": "2.2", "isNewIn22": false, "status": "active" },
        { "id": "2.2.6", "title": "Timeouts", "level": "AAA", "principle": "Operable", "guideline": "2.2", "isNewIn22": false, "status": "active" },
    
        { "id": "2.3.1", "title": "Three Flashes or Below Threshold", "level": "A", "principle": "Operable", "guideline": "2.3", "isNewIn22": false, "status": "active" },
        { "id": "2.3.2", "title": "Three Flashes", "level": "AAA", "principle": "Operable", "guideline": "2.3", "isNewIn22": false, "status": "active" },
        { "id": "2.3.3", "title": "Animation from Interactions", "level": "AAA", "principle": "Operable", "guideline": "2.3", "isNewIn22": false, "status": "active" },
    
        { "id": "2.4.1", "title": "Bypass Blocks", "level": "A", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.2", "title": "Page Titled", "level": "A", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.3", "title": "Focus Order", "level": "A", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.4", "title": "Link Purpose (In Context)", "level": "A", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.5", "title": "Multiple Ways", "level": "AA", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.6", "title": "Headings and Labels", "level": "AA", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.7", "title": "Focus Visible", "level": "AA", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.8", "title": "Location", "level": "AAA", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.9", "title": "Link Purpose (Link Only)", "level": "AAA", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.10", "title": "Section Headings", "level": "AAA", "principle": "Operable", "guideline": "2.4", "isNewIn22": false, "status": "active" },
        { "id": "2.4.11", "title": "Focus Not Obscured (Minimum)", "level": "AA", "principle": "Operable", "guideline": "2.4", "isNewIn22": true, "status": "active" },
        { "id": "2.4.12", "title": "Focus Not Obscured (Enhanced)", "level": "AAA", "principle": "Operable", "guideline": "2.4", "isNewIn22": true, "status": "active" },
        { "id": "2.4.13", "title": "Focus Appearance", "level": "AAA", "principle": "Operable", "guideline": "2.4", "isNewIn22": true, "status": "active" },
    
        { "id": "2.5.1", "title": "Pointer Gestures", "level": "A", "principle": "Operable", "guideline": "2.5", "isNewIn22": false, "status": "active" },
        { "id": "2.5.2", "title": "Pointer Cancellation", "level": "A", "principle": "Operable", "guideline": "2.5", "isNewIn22": false, "status": "active" },
        { "id": "2.5.3", "title": "Label in Name", "level": "A", "principle": "Operable", "guideline": "2.5", "isNewIn22": false, "status": "active" },
        { "id": "2.5.4", "title": "Motion Actuation", "level": "A", "principle": "Operable", "guideline": "2.5", "isNewIn22": false, "status": "active" },
        { "id": "2.5.5", "title": "Target Size (Enhanced)", "level": "AAA", "principle": "Operable", "guideline": "2.5", "isNewIn22": false, "status": "active" },
        { "id": "2.5.6", "title": "Concurrent Input Mechanisms", "level": "AAA", "principle": "Operable", "guideline": "2.5", "isNewIn22": false, "status": "active" },
        { "id": "2.5.7", "title": "Dragging Movements", "level": "AA", "principle": "Operable", "guideline": "2.5", "isNewIn22": true, "status": "active" },
        { "id": "2.5.8", "title": "Target Size (Minimum)", "level": "AA", "principle": "Operable", "guideline": "2.5", "isNewIn22": true, "status": "active" },
    
        { "id": "3.1.1", "title": "Language of Page", "level": "A", "principle": "Understandable", "guideline": "3.1", "isNewIn22": false, "status": "active" },
        { "id": "3.1.2", "title": "Language of Parts", "level": "AA", "principle": "Understandable", "guideline": "3.1", "isNewIn22": false, "status": "active" },
        { "id": "3.1.3", "title": "Unusual Words", "level": "AAA", "principle": "Understandable", "guideline": "3.1", "isNewIn22": false, "status": "active" },
        { "id": "3.1.4", "title": "Abbreviations", "level": "AAA", "principle": "Understandable", "guideline": "3.1", "isNewIn22": false, "status": "active" },
        { "id": "3.1.5", "title": "Reading Level", "level": "AAA", "principle": "Understandable", "guideline": "3.1", "isNewIn22": false, "status": "active" },
        { "id": "3.1.6", "title": "Pronunciation", "level": "AAA", "principle": "Understandable", "guideline": "3.1", "isNewIn22": false, "status": "active" },
    
        { "id": "3.2.1", "title": "On Focus", "level": "A", "principle": "Understandable", "guideline": "3.2", "isNewIn22": false, "status": "active" },
        { "id": "3.2.2", "title": "On Input", "level": "A", "principle": "Understandable", "guideline": "3.2", "isNewIn22": false, "status": "active" },
        { "id": "3.2.3", "title": "Consistent Navigation", "level": "AA", "principle": "Understandable", "guideline": "3.2", "isNewIn22": false, "status": "active" },
        { "id": "3.2.4", "title": "Consistent Identification", "level": "AA", "principle": "Understandable", "guideline": "3.2", "isNewIn22": false, "status": "active" },
        { "id": "3.2.5", "title": "Change on Request", "level": "AAA", "principle": "Understandable", "guideline": "3.2", "isNewIn22": false, "status": "active" },
        { "id": "3.2.6", "title": "Consistent Help", "level": "A", "principle": "Understandable", "guideline": "3.2", "isNewIn22": true, "status": "active" },
    
        { "id": "3.3.1", "title": "Error Identification", "level": "A", "principle": "Understandable", "guideline": "3.3", "isNewIn22": false, "status": "active" },
        { "id": "3.3.2", "title": "Labels or Instructions", "level": "A", "principle": "Understandable", "guideline": "3.3", "isNewIn22": false, "status": "active" },
        { "id": "3.3.3", "title": "Error Suggestion", "level": "AA", "principle": "Understandable", "guideline": "3.3", "isNewIn22": false, "status": "active" },
        { "id": "3.3.4", "title": "Error Prevention (Legal, Financial, Data)", "level": "AA", "principle": "Understandable", "guideline": "3.3", "isNewIn22": false, "status": "active" },
        { "id": "3.3.5", "title": "Help", "level": "AAA", "principle": "Understandable", "guideline": "3.3", "isNewIn22": false, "status": "active" },
        { "id": "3.3.6", "title": "Error Prevention (All)", "level": "AAA", "principle": "Understandable", "guideline": "3.3", "isNewIn22": false, "status": "active" },
        { "id": "3.3.7", "title": "Redundant Entry", "level": "A", "principle": "Understandable", "guideline": "3.3", "isNewIn22": true, "status": "active" },
        { "id": "3.3.8", "title": "Accessible Authentication (Minimum)", "level": "AA", "principle": "Understandable", "guideline": "3.3", "isNewIn22": true, "status": "active" },
        { "id": "3.3.9", "title": "Accessible Authentication (Enhanced)", "level": "AAA", "principle": "Understandable", "guideline": "3.3", "isNewIn22": true, "status": "active" },
  
        { "id": "4.1.1", "title": "Parsing", "level": null, "principle": "Robust", "guideline": "4.1", "isNewIn22": false, "status": "removed_obsolete_in_22" },
        { "id": "4.1.2", "title": "Name, Role, Value", "level": "A", "principle": "Robust", "guideline": "4.1", "isNewIn22": false, "status": "active" },
        { "id": "4.1.3", "title": "Status Messages", "level": "AA", "principle": "Robust", "guideline": "4.1", "isNewIn22": false, "status": "active" }
      ]
    }

-   **ADA doesn’t have a per–success-criterion clause system** the way standards do. For web/app accessibility, the closest “clause mapping” is **ADA Title II’s DOJ web rule**, which **adopts WCAG 2.1 Level A/AA** as the technical standard in **28 CFR Part 35, Subpart H**.
    
-   **EN 301 549 clause mapping is systematic for web**: **WCAG X.Y.Z ↔ EN 301 549 9.X.Y.Z** (for Chapter/Clause 9 “Web”). EN 301 549 v3.2.1 is based on WCAG 2.1, so _WCAG 2.2 new SC won’t have EN 301 549 9. equivalents_* in that version.
    
-   **Section 508** (ICT Refresh) incorporates **WCAG 2.0 Level A + AA** via **E205.4 / E207.2**, so per-SC mapping is effectively “this SC is required if it’s WCAG 2.0 A/AA”.
    

  

Below is a **JSON dataset** for WCAG 2.2 SC with:

-   testability: **Automated / Manual / Partial**
    
-   mapping: **ADA Title II (WCAG 2.1 A/AA)** applicability, **Section 508 (WCAG 2.0 A/AA)** applicability, **EN 301 549 web clause** (9.*) where applicable

    {
      "standard": "WCAG",
      "version": "2.2",
      "source": "https://www.w3.org/TR/WCAG22/",
      "notes": {
        "ada_title_ii": "DOJ Title II web/app rule adopts WCAG 2.1 Level A and AA (28 CFR Part 35, Subpart H). WCAG 2.2 SC are not explicitly required by that rule.",
        "section_508": "Revised 508 Standards incorporate WCAG 2.0 Level A and AA by reference (e.g., E205.4 / E207.2).",
        "en_301_549": "EN 301 549 web requirements (Clause 9) mirror WCAG numbering: 9.X.Y.Z corresponds to WCAG X.Y.Z (WCAG 2.1 in EN 301 549 v3.2.1)."
      },
      "successCriteria": [
        {
          "id": "1.1.1",
          "title": "Non-text Content",
          "level": "A",
          "status": "active",
          "testability": "Partial",
          "mapping": {
            "ada_title_ii_wcag21": { "in_scope": true, "reason": "WCAG 2.1 A/AA" },
            "section_508_wcag20": { "in_scope": true, "reason": "WCAG 2.0 A/AA incorporated" },
            "en_301_549_web": { "clause": "9.1.1.1", "in_scope": true }
          }
        },
    
        { "id": "1.2.1", "title": "Audio-only and Video-only (Prerecorded)", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.2.1", "in_scope": true } } },
        { "id": "1.2.2", "title": "Captions (Prerecorded)", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.2.2", "in_scope": true } } },
        { "id": "1.2.3", "title": "Audio Description or Media Alternative (Prerecorded)", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.2.3", "in_scope": true } } },
        { "id": "1.2.4", "title": "Captions (Live)", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.2.4", "in_scope": true } } },
        { "id": "1.2.5", "title": "Audio Description (Prerecorded)", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.2.5", "in_scope": true } } },
        { "id": "1.2.6", "title": "Sign Language (Prerecorded)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "AAA not required" }, "section_508_wcag20": { "in_scope": false, "reason": "AAA not required" }, "en_301_549_web": { "clause": "9.1.2.6", "in_scope": false, "reason": "Not required in EN 301 549 core WCAG 2.1 A/AA set" } } },
        { "id": "1.2.7", "title": "Extended Audio Description (Prerecorded)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.2.7", "in_scope": false } } },
        { "id": "1.2.8", "title": "Media Alternative (Prerecorded)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.2.8", "in_scope": false } } },
        { "id": "1.2.9", "title": "Audio-only (Live)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.2.9", "in_scope": false } } },
    
        { "id": "1.3.1", "title": "Info and Relationships", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.3.1", "in_scope": true } } },
        { "id": "1.3.2", "title": "Meaningful Sequence", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.3.2", "in_scope": true } } },
        { "id": "1.3.3", "title": "Sensory Characteristics", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.3.3", "in_scope": true } } },
        { "id": "1.3.4", "title": "Orientation", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false, "reason": "Not in WCAG 2.0" }, "en_301_549_web": { "clause": "9.1.3.4", "in_scope": true } } },
        { "id": "1.3.5", "title": "Identify Input Purpose", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.3.5", "in_scope": true } } },
        { "id": "1.3.6", "title": "Identify Purpose", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.3.6", "in_scope": false } } },
    
        { "id": "1.4.1", "title": "Use of Color", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.4.1", "in_scope": true } } },
        { "id": "1.4.2", "title": "Audio Control", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.4.2", "in_scope": true } } },
        { "id": "1.4.3", "title": "Contrast (Minimum)", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.4.3", "in_scope": true } } },
        { "id": "1.4.4", "title": "Resize Text", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.4.4", "in_scope": true } } },
        { "id": "1.4.5", "title": "Images of Text", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.1.4.5", "in_scope": true } } },
        { "id": "1.4.6", "title": "Contrast (Enhanced)", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.6", "in_scope": false } } },
        { "id": "1.4.7", "title": "Low or No Background Audio", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.7", "in_scope": false } } },
        { "id": "1.4.8", "title": "Visual Presentation", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.8", "in_scope": false } } },
        { "id": "1.4.9", "title": "Images of Text (No Exception)", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.9", "in_scope": false } } },
        { "id": "1.4.10", "title": "Reflow", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.10", "in_scope": true } } },
        { "id": "1.4.11", "title": "Non-text Contrast", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.11", "in_scope": true } } },
        { "id": "1.4.12", "title": "Text Spacing", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.12", "in_scope": true } } },
        { "id": "1.4.13", "title": "Content on Hover or Focus", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.1.4.13", "in_scope": true } } },
    
        { "id": "2.1.1", "title": "Keyboard", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.1.1", "in_scope": true } } },
        { "id": "2.1.2", "title": "No Keyboard Trap", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.1.2", "in_scope": true } } },
        { "id": "2.1.3", "title": "Keyboard (No Exception)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.1.3", "in_scope": false } } },
        { "id": "2.1.4", "title": "Character Key Shortcuts", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.1.4", "in_scope": true } } },
    
        { "id": "2.2.1", "title": "Timing Adjustable", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.2.1", "in_scope": true } } },
        { "id": "2.2.2", "title": "Pause, Stop, Hide", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.2.2", "in_scope": true } } },
        { "id": "2.2.3", "title": "No Timing", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.2.3", "in_scope": false } } },
        { "id": "2.2.4", "title": "Interruptions", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.2.4", "in_scope": false } } },
        { "id": "2.2.5", "title": "Re-authenticating", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.2.5", "in_scope": false } } },
        { "id": "2.2.6", "title": "Timeouts", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.2.6", "in_scope": false } } },
    
        { "id": "2.3.1", "title": "Three Flashes or Below Threshold", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.3.1", "in_scope": true } } },
        { "id": "2.3.2", "title": "Three Flashes", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.3.2", "in_scope": false } } },
        { "id": "2.3.3", "title": "Animation from Interactions", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.3.3", "in_scope": false } } },
    
        { "id": "2.4.1", "title": "Bypass Blocks", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.1", "in_scope": true } } },
        { "id": "2.4.2", "title": "Page Titled", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.2", "in_scope": true } } },
        { "id": "2.4.3", "title": "Focus Order", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.3", "in_scope": true } } },
        { "id": "2.4.4", "title": "Link Purpose (In Context)", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.4", "in_scope": true } } },
        { "id": "2.4.5", "title": "Multiple Ways", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.5", "in_scope": true } } },
        { "id": "2.4.6", "title": "Headings and Labels", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.6", "in_scope": true } } },
        { "id": "2.4.7", "title": "Focus Visible", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.2.4.7", "in_scope": true } } },
        { "id": "2.4.8", "title": "Location", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.4.8", "in_scope": false } } },
        { "id": "2.4.9", "title": "Link Purpose (Link Only)", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.4.9", "in_scope": false } } },
        { "id": "2.4.10", "title": "Section Headings", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.4.10", "in_scope": false } } },
    
        { "id": "2.4.11", "title": "Focus Not Obscured (Minimum)", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "WCAG 2.2-only SC" }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false, "reason": "Not in EN 301 549 v3.2.1 (WCAG 2.1)" } } },
        { "id": "2.4.12", "title": "Focus Not Obscured (Enhanced)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
        { "id": "2.4.13", "title": "Focus Appearance", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
    
        { "id": "2.5.1", "title": "Pointer Gestures", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.5.1", "in_scope": true } } },
        { "id": "2.5.2", "title": "Pointer Cancellation", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.5.2", "in_scope": true } } },
        { "id": "2.5.3", "title": "Label in Name", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.5.3", "in_scope": true } } },
        { "id": "2.5.4", "title": "Motion Actuation", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.5.4", "in_scope": true } } },
        { "id": "2.5.5", "title": "Target Size (Enhanced)", "level": "AAA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.5.5", "in_scope": false } } },
        { "id": "2.5.6", "title": "Concurrent Input Mechanisms", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.2.5.6", "in_scope": false } } },
    
        { "id": "2.5.7", "title": "Dragging Movements", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "WCAG 2.2-only SC" }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
        { "id": "2.5.8", "title": "Target Size (Minimum)", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "WCAG 2.2-only SC" }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
    
        { "id": "3.1.1", "title": "Language of Page", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.1.1", "in_scope": true } } },
        { "id": "3.1.2", "title": "Language of Parts", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.1.2", "in_scope": true } } },
        { "id": "3.1.3", "title": "Unusual Words", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.1.3", "in_scope": false } } },
        { "id": "3.1.4", "title": "Abbreviations", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.1.4", "in_scope": false } } },
        { "id": "3.1.5", "title": "Reading Level", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.1.5", "in_scope": false } } },
        { "id": "3.1.6", "title": "Pronunciation", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.1.6", "in_scope": false } } },
    
        { "id": "3.2.1", "title": "On Focus", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.2.1", "in_scope": true } } },
        { "id": "3.2.2", "title": "On Input", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.2.2", "in_scope": true } } },
        { "id": "3.2.3", "title": "Consistent Navigation", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.2.3", "in_scope": true } } },
        { "id": "3.2.4", "title": "Consistent Identification", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.2.4", "in_scope": true } } },
        { "id": "3.2.5", "title": "Change on Request", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.2.5", "in_scope": false } } },
    
        { "id": "3.2.6", "title": "Consistent Help", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "WCAG 2.2-only SC" }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
    
        { "id": "3.3.1", "title": "Error Identification", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.3.1", "in_scope": true } } },
        { "id": "3.3.2", "title": "Labels or Instructions", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.3.2", "in_scope": true } } },
        { "id": "3.3.3", "title": "Error Suggestion", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.3.3", "in_scope": true } } },
        { "id": "3.3.4", "title": "Error Prevention (Legal, Financial, Data)", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.3.3.4", "in_scope": true } } },
        { "id": "3.3.5", "title": "Help", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.3.5", "in_scope": false } } },
        { "id": "3.3.6", "title": "Error Prevention (All)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.3.3.6", "in_scope": false } } },
    
        { "id": "3.3.7", "title": "Redundant Entry", "level": "A", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "WCAG 2.2-only SC" }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
        { "id": "3.3.8", "title": "Accessible Authentication (Minimum)", "level": "AA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "WCAG 2.2-only SC" }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
        { "id": "3.3.9", "title": "Accessible Authentication (Enhanced)", "level": "AAA", "status": "active", "testability": "Manual",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": null, "in_scope": false } } },
    
        { "id": "4.1.1", "title": "Parsing", "level": null, "status": "removed_obsolete_in_22", "testability": "Automated",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": false, "reason": "Removed in WCAG 2.2" }, "section_508_wcag20": { "in_scope": true, "reason": "WCAG 2.0 includes 4.1.1" }, "en_301_549_web": { "clause": "9.4.1.1", "in_scope": true } } },
        { "id": "4.1.2", "title": "Name, Role, Value", "level": "A", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": true }, "en_301_549_web": { "clause": "9.4.1.2", "in_scope": true } } },
        { "id": "4.1.3", "title": "Status Messages", "level": "AA", "status": "active", "testability": "Partial",
          "mapping": { "ada_title_ii_wcag21": { "in_scope": true }, "section_508_wcag20": { "in_scope": false }, "en_301_549_web": { "clause": "9.4.1.3", "in_scope": true } } }
      ]
    }

### Beyond AXE-Core testing
Below is a practical split of the Manual SCs in your matrix by what’s realistically possible today. I’m treating “code‑testable” as deterministic rules or scripted checks (not AI), “AI‑testable” as NLP/CV/ASR‑style heuristics, and “manual‑only” as things that still require human judgement in real flows.

## 1) Not currently covered by axe‑core (your pipeline)
All SCs marked testability=Manual in the matrix are not reliably covered by axe‑core out of the box. That includes:
1.2.1–1.2.9, 1.3.3, 1.4.2, 1.4.7, 1.4.8, 2.1.1–2.1.3, 2.2.2–2.2.7, 2.4.1, 2.4.3, 2.4.5, 2.4.7, 2.4.8, 2.4.11–2.4.12, 2.5.1–2.5.2, 2.5.4, 2.5.6–2.5.7, 3.1.3–3.1.6, 3.2.3–3.2.6, 3.3.4–3.3.9.

## 2) Code‑testable (custom rules / scripted checks)
These can be tested with deterministic logic or automated browser flows (not AI), though many are still “partial”:

2.1.1 Keyboard
2.1.2 No Keyboard Trap
2.1.3 Keyboard (No Exception)
2.2.2 Pause, Stop, Hide
2.2.7 Dragging Movements
2.4.1 Bypass Blocks
2.4.3 Focus Order
2.4.7 Focus Visible
2.4.11 Focus Not Obscured (Minimum)
2.4.12 Focus Not Obscured (Enhanced)
2.5.1 Pointer Gestures
2.5.2 Pointer Cancellation
2.5.4 Motion Actuation
2.5.6 Concurrent Input Mechanisms
2.5.7 Dragging Movements
3.2.3 Consistent Navigation (needs multi‑page crawl + diff)
3.2.4 Consistent Identification (multi‑page)
3.2.6 Consistent Help (multi‑page)
1.4.2 Audio Control (detect autoplay >3s + controls)

## 3) AI‑testable (best fit for AI heuristics)
These depend on meaning, content intent, or media interpretation:

1.2.1–1.2.9 Media alternatives, captions, audio descriptions, sign language (ASR/CV)
1.3.3 Sensory Characteristics
1.4.7 Low or No Background Audio
1.4.8 Visual Presentation
2.4.5 Multiple Ways
2.4.8 Location
3.1.3 Unusual Words
3.1.4 Abbreviations
3.1.5 Reading Level
3.1.6 Pronunciation
3.2.5 Change on Request
3.3.4 Error Prevention (Legal, Financial, Data)
3.3.5 Help
3.3.6 Error Prevention (All)
3.3.7 Redundant Entry
3.3.8 Accessible Authentication (Minimum)
3.3.9 Accessible Authentication (Enhanced)

## 4) Manual‑only (still requires a human in real flows)
These are hard to reliably automate without deep product knowledge or real‑time media:

1.2.4 Captions (Live)
1.2.9 Audio‑only (Live)
2.2.3 No Timing
2.2.4 Interruptions
2.2.5 Re‑authenticating
2.2.6 Timeouts