# Black Wire 0.16.1 — manufacturer documentation recovery

Collection 2026.10.4 adds 571 reference attachments across 416 existing Waveshare, M5Stack and NodeMCU listings: 555 PDFs, nine physical-pinout entries, five GPIO function diagrams and two connector-function sheets. Nine map entries represent eight distinct images; assembly aliases can share a source.

Official manuals and schematics sit beside their manufacturer links. NodeMCU DevKit 0.9/1.0 schematics, ToughC5 and Unit 8Servos2-I2C manuals, ATOM Lite/StampS3A/Nesso N1 maps and Waveshare references are included. Large Nesso images use efficient viewing copies while full-resolution originals remain available.

The guide distinguishes board documentation from chip datasheets and marks unresolved physical-map gaps. Pin assignments are not independently electrically verified. Manufacturer artwork retains its original rights. First Edition / 2026 and the physical book draft are unchanged.

The **Original PDF** filter now recognizes both saved-PDF labels used by collection snapshots. Imported manuals appear in that filter and use the same readable PDF label in the viewer, without rewriting published source records.

## Validation and platform status

All 140 source tests passed. The 3,291-listing search audit, original-file hash checks and browser regression passed, including the PDF-filter compatibility fix, images, PDFs, gesture zoom, mobile layout and the sandboxed store embed.

The [native installer/update workflow](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/38852772454) passed on Windows Server 2022/2025 and Ubuntu 22.04/24.04. Checks include fresh installation, sandboxed launch, original-file hashes, recovery from a failed update check, a real package download/install/relaunch, cache reuse and preservation of saved workbench data. Windows also checks legacy-library preservation. The updater baseline is the candidate packaged as QA-only 0.13.99, not a separately published older binary.

Runtime build commit: `c88668a90366976cec120a8a19d20654e4dd043e`. Collection commit: `9673f321a74bd0426b994ac82b450978ddd841c6`. Later release-documentation edits do not change the tested runtime.

Release contents include the Windows x64 installer and blockmap, Linux amd64 DEB, both updater metadata files, checksums and a native validation report. Installed supported clients can check for updates in **Updates & offline library**; cached references and saved workbench data are retained.

Windows packages are unsigned and may still produce reputation warnings. Linux coverage is Ubuntu 22.04/24.04; other distributions are not claimed tested. No new macOS binary or AppImage is included.

[Install and update](DOWNLOADS.md) · [Documentation scope and remaining gaps](https://git.churchofmalware.org/Valleytech/black-wire-pinouts/src/branch/main/docs/EXPANSION-2026.10.4.md)
