# Sigma Rules Catalogue PoC (GitHub Pages)

A lightweight, browser-hosted prototype that pulls **SigmaHQ** rules, builds a searchable JSON index, and publishes a static “rules catalogue” site to **GitHub Pages** using **GitHub Actions**.

This is intended as a quick proof-of-concept for browsing and filtering Sigma rules (for example by `logsource` and `level`) without standing up any servers.

## What this does

On every push to `main` (and optionally on a nightly schedule), the workflow:

1. Clones the upstream Sigma repository (rules are YAML).
2. Parses rules under `sigma/rules/` and generates `site/data/rules.json`.
3. Publishes the static site to GitHub Pages using the official Pages deployment actions. 

## Why this approach

- **Low maintenance:** static site, regenerated automatically.
- **No local machine needed:** you can create/edit everything in GitHub’s web UI.
- **Reproducible builds:** Actions does the same steps each run.
- **Fast UI:** client-side filtering over a prebuilt JSON index.


## Prerequisites

- A GitHub repository with Actions enabled.
- GitHub Pages enabled for the repository.
  - Pages is available for public repos on GitHub Free, and for public + private repos on certain paid plans.

## Setup (browser-only)

### 1) Create/edit files in the browser

You can do all edits directly in GitHub:

- Use **Add file → Create new file**, or
- Open the **github.dev** editor by pressing `.` (period) in the repository. 

Create the folders and files shown in “Repo layout” and paste in the contents from this PoC.

### 2) Enable GitHub Pages

In the repository:

- **Settings → Pages**
- Under **Build and deployment**, set **Source** to **GitHub Actions**.

### 3) Run the workflow

- Pushing a commit to `main` will trigger the workflow (if configured with `on: push`), or
- Use **Actions → Run workflow** if `workflow_dispatch` is enabled.

After a successful run, the Pages URL will appear in **Settings → Pages**.

## How the indexing works

The index builder reads Sigma rule YAML and extracts a compact set of metadata that is useful for filtering and browsing, typically including:

- `title`
- `id`
- `status`
- `level`
- `tags`
- `logsource.product`, `logsource.category`, `logsource.service`
- `path` and a link back to the upstream file in SigmaHQ

Sigma rules are YAML and include consistent metadata fields intended for this kind of cataloguing and processing.

Note: SigmaHQ has evolved the rule repository structure and rule types over time, so using file paths/folders as an additional facet can be useful. 

## Workflow notes (Pages deploy)

This repo uses the “upload artifact + deploy” model:

- `actions/upload-pages-artifact` uploads the built static site output as an artifact.
- `actions/deploy-pages` deploys that artifact to GitHub Pages. 

The deploy job typically requires these permissions:

- `pages: write`
- `id-token: write`

## Updating the catalogue

- Edit the front-end under `site/` to add more filters, better UX, or additional fields.
- Edit `scripts/build_index.py` to extract more Sigma metadata (for example references, author, date, ATT&CK tags conventions, etc.).
- The site updates automatically on the next workflow run.

## Troubleshooting

### Pages shows 404 / site not updating
- Confirm **Settings → Pages → Source = GitHub Actions**. 
- Check the latest workflow run in **Actions** for failures.

### Deploy step fails with permissions
- Ensure the workflow includes `pages: write` and `id-token: write` on the job that deploys. 

### `rules.json` is empty or missing fields
- Confirm the workflow clones SigmaHQ and points the indexer at `sigma/rules/`. 
- Inspect the build logs for YAML parsing errors.

## Credits / upstream

- Sigma rules are sourced from the SigmaHQ main rule repository. 


