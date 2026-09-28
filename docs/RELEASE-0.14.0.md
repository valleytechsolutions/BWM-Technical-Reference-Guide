# Black Wire 0.14.0 — installation and updates

First Edition / 2026 · Collection **2026.09.13**, unchanged.

- One Windows installer replaces multipart ZIP extraction.
- **Updates & offline library** provides checks, download progress and **Restart & update**.
- Downloaded references live outside the installation. Updates preserve bookmarks, measurements and unchanged originals.
- Search, previews and wiring guides are bundled. Originals download on demand, or as a complete offline library with pause/retry and SHA-256 verification.
- Older Windows libraries are preserved before the previous uninstaller runs.
- Linux DEB packages include in-app updates through the system package manager.
- Failed image loads now offer retry and explain when connectivity is required.

Users of 0.13 or earlier need this installer once to gain the updater. Later updates run inside Black Wire. On a fresh install, download the complete library inside the app before relying on offline access. [Instructions](DOWNLOADS.md).

## Validation and limits

The [native release checks](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/36464710075) passed on Windows Server 2022/2025 and Ubuntu 22.04/24.04 (DEB). They cover fresh installation, Chromium sandbox enabled, image/PDF checksums, failed-update recovery, real update download/install/relaunch, saved workbench data and cache reuse. Windows also checks legacy-library preservation. The release includes the exact tested packages and a machine-readable native-validation.json report.

All 71 source tests passed. A local Windows 11 build 26200 installation opened successfully with its saved workbench unchanged. The complete 8,196-file reference index passed a fresh offline checksum scan after download. Browser regression runs before the automatic website publication.

Windows remains **unsigned**, so reputation warnings remain possible. Linux validation covers only the package types/distributions identified in the native reports. AppImage is withheld because automatic restart did not pass validation. No new verified macOS package is supplied. No test suite establishes freedom from every bug.

Previous releases remain unchanged. This is a software update, not a new book edition. Manufacturer artwork, the collection snapshot and the book draft are unchanged.
