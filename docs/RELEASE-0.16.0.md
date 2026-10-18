# Black Wire 0.16.0 — C5 references and project support

First Edition / 2026 · Collection **2026.10.3**.

- A small **Support the project** card near the bottom of the sidebar and a footer link open Valleytech Solutions on Patreon. No third-party widget or tracking request loads with the guide.
- Waveshare ESP32-C5-Pico and ESP32-C5-MINI-KIT pinouts were verified against current source files; original schematics and documented variant/search aliases were added.
- Three new board/revision records and six enriched records add eleven references across Waveshare, M5Stack and NodeMCU. Physical pinouts, function sheets, component labels and schematics keep their separate scope and rights notes.
- Includes the breadboard/device maker features introduced in 0.15 and the mobile reference-header fix from 0.15.1.
- Retains in-app updates, persistent workbench data and the verified offline reference cache introduced in 0.14. Original files download on demand or through **Download offline library**.

[Reference review and remaining gaps](https://git.churchofmalware.org/Valleytech/black-wire-pinouts/src/branch/main/docs/EXPANSION-2026.10.3.md) · [Installation instructions](DOWNLOADS.md).

## Validation and platform status

All 139 source tests passed. Search coverage checks passed for 3,291 catalog listings, and browser regression passed for search, original images, PDFs, gesture zoom, mobile layout, the Shopify-style embed and the optional support link.

The [native installer/update workflow](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/38845722643) passed on Windows Server 2022/2025 and Ubuntu 22.04/24.04. It covers fresh installation, sandboxed launch, original image/PDF checksums, recovery after a failed update check, a real package download/install/relaunch, saved workbench data and cache reuse. Windows also verifies legacy-library preservation. The updater baseline is the same candidate code packaged as QA-only 0.13.99; it is not a separately published older release.

Package build commit: `03e400663357f9f3494991e480c602c038369207`. Collection commit: `19c1c076e64b60013436905cedf92ce9ea84ddbe`. Subsequent release-documentation edits do not change the tested runtime.

This normal release includes the exact tested Windows x64 installer, Linux x64 DEB, updater metadata, checksums and native validation report. Windows remains **unsigned**; reputation warnings are still possible. No new macOS package or AppImage is claimed. Other Linux distributions need separate testing. Earlier releases stay unchanged. No test suite establishes freedom from every bug.

The editorial edition and book draft are unchanged. Manufacturer artwork retains its original rights.
