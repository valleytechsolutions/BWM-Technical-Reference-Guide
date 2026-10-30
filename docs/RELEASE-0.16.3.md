# Black Wire 0.16.3 — October hardware and desktop library update

This release brings collection **2026.10.6** to the desktop, including the preceding **2026.10.5** browser additions. The latest intake adds **13 listings**, updates one existing board and saves **39 references**, including **five physical pinout images**. First Edition / 2026 remains unchanged.

New physical references cover Wireless-Tag WT9932S31-TINY (ESP32-S31), Adafruit Metro ESP32-P4 Hydra, Waveshare ESP32-P4-Core and ESP32-S3-LR1121-ePaper-2.9, and M5Stack Stamp Timer Power2. Four M5Stack motion/magnetic sensor units, LattePanda Sigma 2 connector diagrams and additional Wireless-Tag manuals/schematics are also included. Search keeps ESP32-S31 distinct from ESP32-S3.

Source discovery was attempted across all 163 existing brand labels. The public audit records inaccessible sources and remaining documentation gaps; this is not a complete worldwide inventory. Original maps, connector labels, schematics and component datasheets retain separate scope and rights labels. Pin assignments are not independently electrically tested.

## Update an installed app

1. Open **Updates & offline library → Check for updates**.
2. Choose **Download update**, then **Restart & update**.
3. Use **Download offline library** to cache the new references for offline use. Unchanged verified originals are reused; saved workbench data stays outside the installation.

Users on 0.13 or earlier need the current installer once to gain in-app updates. The Windows setup is a single file; separate collection ZIP downloads are not required for installation. Original documents download inside the app.

The current complete reference library is approximately **4.5 GB**, including browsing assets. Allow **at least 8 GB free** for a fresh installation, reference downloads and update workspace, plus space for retained older caches and any legacy-library migration. Manufacturer website links still require internet.

## Validation and platform status

All **142 source tests** passed. Search validation covered **3,338 listings** and 15 wiring guides. File hashes, browser search, images, PDFs, gesture zoom, mobile layout and the sandboxed embed passed. All five new physical maps and their PDFs were opened in the browser.

The [native installer/update workflow](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/41010557901) passed on **Windows Server 2022/2025** and **Ubuntu 22.04/24.04**. It checks fresh installation, sandboxed launch, original-file checksums, recovery after a failed update check, actual update download/install/relaunch, offline cache reuse and saved workbench preservation. Windows also checks legacy-library preservation. The older update fixture is this candidate packaged as QA-only 0.13.99, not a separately published older binary.

Runtime build commit: `4336ea66d73ca7cc1c2d8903dbc50275482d5b7f`. Collection commit: `69987120aa765d6e0356eaa65caf4501538a46a5`. Later release-documentation edits do not change the tested runtime.

The release contains the exact tested Windows x64 setup and blockmap, Linux amd64 DEB, `latest.yml`, `latest-linux.yml`, `SHA256SUMS.txt` and `native-validation.json`. This is a normal release, not a prerelease. GitHub hosts the desktop updater feed and complete installer files. Gitea mirrors the source, release notes, validation and checksums, with direct GitHub download links because its upload limit rejects large release files.

Windows is **unsigned** and may still show reputation warnings. Linux coverage is the two Ubuntu environments above; other distributions are not claimed tested. **No new macOS binary or AppImage is included.** Existing published releases remain unchanged.

[Install and update](DOWNLOADS.md) · [New references and open gaps](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.10.6.md) · [Previous collection additions](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.10.5.md)
