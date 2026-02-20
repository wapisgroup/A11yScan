# Ablelytics Scan Action (Scaffold)

This action triggers your Ablelytics API after client deployment:
- Optional page collection
- Full scan, or page-set scan
- Optional polling until run completion

## Inputs

- `api-base-url` (required)
  - Example: `https://us-central1-<project>.cloudfunctions.net/api/v1`
- `api-key` (required)
- `project-id` (required)
- `scan-mode` (optional, default: `full`)
  - Allowed: `full`, `page-set`
- `page-set-id` (optional, required if `scan-mode=page-set`)
- `include-page-collection` (optional, default: `false`)
- `wait-for-completion` (optional, default: `true`)
- `poll-interval-seconds` (optional, default: `10`)
- `timeout-seconds` (optional, default: `1800`)

## Outputs

- `page-collection-run-id`
- `scan-run-id`
- `final-status`

## Example (Full Scan)

```yaml
name: Post-Deploy Accessibility Test

on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  a11y:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Ablelytics full scan
        uses: ./.github/actions/a11y-scan-action
        with:
          api-base-url: ${{ secrets.A11Y_API_BASE_URL }}
          api-key: ${{ secrets.A11Y_API_KEY }}
          project-id: ${{ vars.A11Y_PROJECT_ID }}
          scan-mode: full
          include-page-collection: true
```

## Example (Page Set Scan)

```yaml
- name: Run Ablelytics page set scan
  uses: ./.github/actions/a11y-scan-action
  with:
    api-base-url: ${{ secrets.A11Y_API_BASE_URL }}
    api-key: ${{ secrets.A11Y_API_KEY }}
    project-id: ${{ vars.A11Y_PROJECT_ID }}
    scan-mode: page-set
    page-set-id: ${{ vars.A11Y_PAGE_SET_ID }}
```

## Publish Pattern

For client-friendly usage, publish this action in a dedicated repo and tag versions:
- `wapisgroup/a11y-scan-action@v1`

Then clients only keep:
- `api-key`
- `project-id`
- optional `page-set-id`

# how do you make it publicly available

Two options.

1) Publish from this repo (fastest)

Make the repo public.
Commit/push the action files currently in
/Users/macbookpro/git/accessibility-checker/react_firebase_app_full/.github/actions/a11y-scan-action.
Tag a release:
git tag -a v1.0.0 -m "Ablelytics scan action v1.0.0"
git tag -a v1 -m "Major v1"
git push origin main --tags
Clients use:
- uses: wapisgroup/react_firebase_app_full/.github/actions/a11y-scan-action@v1
2) Recommended: dedicated public repo

Create public repo wapisgroup/a11y-scan-action.
Move action files to repo root: action.yml, index.js, README.md (plus LICENSE).
Push and tag v1.0.0 + v1.
Clients use:
- uses: wapisgroup/a11y-scan-action@v1
Notes:

If repo is private, external clients cannot use it publicly.
For updates, release v1.x.x and move tag v1 to latest compatible version.