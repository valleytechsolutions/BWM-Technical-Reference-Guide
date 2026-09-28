# Black Wire 0.14.0 — installation and updates

First Edition / 2026 · Collection **2026.09.13**, unchanged.

- One Windows installer replaces multipart ZIP extraction.
- **Updates & offline library** provides checks, download progress and **Restart & update**.
- Downloaded references live outside the installation. Updates preserve bookmarks, measurements and unchanged originals.
- Search, previews and wiring guides are bundled. Originals download on demand, or as a complete offline library with pause/retry and SHA-256 verification.
- Older Windows libraries are preserved before the previous uninstaller runs.
- Linux DEB and AppImage packages include in-app updates; AppImage replacement preserves the working file until its replacement is complete.
- Failed image loads now offer retry and explain when connectivity is required.

Users of 0.13 or earlier need this installer once to gain the updater. Later updates run inside Black Wire. On a fresh install, download the complete library inside the app before relying on offline access. [Instructions](DOWNLOADS.md).

## Validation and limits

Native installer/update reports accompany the release after its required CI jobs pass. They cover fresh installation, sandboxed launch, image/PDF delivery, failed-update recovery, real update download/install/relaunch, workbench persistence and cache reuse. Windows also checks legacy-library preservation. Source and browser regression are separate gates.

Windows remains **unsigned**, so reputation warnings remain possible. Linux validation covers only the package types/distributions identified in the native reports. No new verified macOS package is supplied. No test suite establishes freedom from every bug.

Previous releases remain unchanged. This is a software update, not a new book edition. Manufacturer artwork, the collection snapshot and the book draft are unchanged.
