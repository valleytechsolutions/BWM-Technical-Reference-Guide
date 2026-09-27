# Publishing a First Edition update

Kal has requested that guide changes reach the Valleytech website and both public repositories. Keep these destinations synchronized when publishing an update; a local build alone does not finish a guide update.

1. Add only reviewed source assets and provenance to `black-wire-pinouts`. Preserve exact model/revision distinctions, unknown rights, partial-map labels and the source image bytes. Record documentation gaps instead of substituting product photos or chip-package maps.
2. Update the collection metadata, device index, attribution ledger and immutable snapshot number. Run `python tools/build-maker-index.py`, `python tools/audit-pinout-coverage.py`, `python tools/audit-documentation.py`, check document endpoints with `python tools/check-document-links.py --cache <private-cache.jsonl>` (requires requests), apply them with `python tools/publish-link-audit.py --cache <private-cache.jsonl>`, then `python tools/rebuild-indexes.py`. Keep board datasheets, component datasheets, manuals and schematics separate. Verify manifest paths and original SHA-256 hashes. Review private-data and secret scans before committing.
3. Commit and push the collection. Pin that exact commit in the app's `data/library-source.json`, import with `pnpm library:import`, and run relevant tests and native/browser builds.
4. Increment the application version for software changes. **First Edition / 2026** stays the editorial edition until an annual book edition is explicitly prepared. Collection snapshots (`YYYY.MM.N`) and app versions are independent.
5. Deploy only the app's generated `web-release` folder to the existing Cloudflare Pages project `valleytech-black-wire-guide`. The Shopify page embeds its stable production address, so a verified production deployment updates the store's guide too.
6. Check the live Shopify embed and full-screen guide: search, Devices & IoT filters, original images, PDF viewing and a narrow mobile viewport. Keep the Shopify page and existing navigation working.
7. Push the desktop source and publish matching release assets to each repository when distributing a new snapshot/app version. Retain older releases; verify uploaded checksums and file sizes. Windows 0.10+ uses independently extractable, manifest-only library ZIP parts beside the installer. Generate its SHA-256 binding before compiling the installer, publish the installer and all library parts and verify missing/mismatched later-part rejection before any install changes. Each asset must remain below 2 GiB. Only advertise platform binaries actually built and tested. Unsigned installers may still trigger operating-system warnings.
8. Sync the local guide/app working copies and record actual deployment/release versions. Keep research caches, credentials, personal paths, QA logs and user workbench backups out of public artifacts.

Public destinations:

- [Valleytech store guide](https://valleytechsolutions.tech/pages/bwm-technical-reference-guide)
- [Full-screen guide](https://valleytech-black-wire-guide.pages.dev/)
- [Pinout collection](https://github.com/valleytechsolutions/black-wire-pinouts)
- [Desktop app](https://github.com/valleytechsolutions/black-wire-desktop)

See [website deployment](WEBSITE.md) and the collection's [edition policy](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/EDITION.md). A printed edition is not ready until content and third-party print rights have been reviewed and its contents frozen.
