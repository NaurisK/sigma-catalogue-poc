# Sigma Rules Catalogue PoC (GitHub Pages)

A lightweight, browser-hosted prototype that pulls **SigmaHQ** rules, builds a searchable JSON index, and publishes a static “rules catalogue” site to **GitHub Pages** using **GitHub Actions**.

This is intended as a quick proof-of-concept for browsing and filtering Sigma rules (for example by `logsource` and `level`) without standing up any servers.

## What this does

On every push to `main` (and optionally on a nightly schedule), the workflow:

1. Clones the upstream Sigma repository (rules are YAML).
2. Parses rules under `sigma/rules/` and generates `site/data/rules.json`.
3. Publishes the static site to GitHub Pages using the official Pages deployment actions. 

## Credits / upstream

- Sigma rules are sourced from the SigmaHQ main rule repository. 


