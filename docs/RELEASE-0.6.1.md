# Black Wire 0.6.1 / viewer reliability and reference audit

Mobile PDF pages previously could not scroll by touch, and native PDF rotation was ignored. Large zooms could allocate an approximately 57-million-pixel bitmap even at a standard desktop viewport. This update gives PDFs their own scroll area, preserves document rotation, caps rendering at 16 million pixels / 8,192 pixels per side, and keeps page controls visible. Page numbers can be entered directly, failed loads can be retried, and cancelled renders cannot overwrite a newer page.

Rotated pinout images now retain reachable corners. Stored measurements are validated before rendering, leaving malformed original storage intact. Impossible calendar dates are rejected. The About page and sidebar use the package version consistently, and the About logo follows the selected theme.

## Collection 2026.09.6

Two newly tracked SparkFun ESP32 Thing Plus models, WRL-20168 USB-C and WRL-15663 micro-B, have distinct original pinout PDFs and rendered physical header sheets. Three existing records gain supporting documentation: Pro Micro RP2350, Thing Plus RP2350, and ESP32-P4-Function-EV-Board v1.5.2. Supporting photos and schematics are not counted as physical pinouts. Eight new reference entries bring the board collection to 3,011 entries; 1,369 entries are pinout images. [Source audit](https://git.churchofmalware.org/Valleytech/black-wire-pinouts/src/branch/main/docs/QUALITY-AUDIT-2026.09.6.md).

## Verification scope

- All 194 PDF documents / 732 pages rendered in PDF.js, including the newly added references.
- All manifest paths, linked boards, catalog totals and original hashes checked.
- Existing image decode audit: 6,646 original/preview/thumbnail paths. Three oversized originals have working derivatives; one manufacturer PNG remains malformed and is explicitly labeled as needing replacement.
- Regression checks cover intrinsic rotation, page jumps, rapid changes, canvas limits, mobile touch scrolling, visible controls and failed-load retry.
- Workbench tests cover image bounds, malformed storage preservation, search, bookmarks, calculators, measurements, backups, themes, maker galleries and pin-purpose tables.
- Windows x64 packaged-app checks passed for offline files, original-file saving, saved-board persistence and PDF rotation, page navigation, rapid changes and canvas limits. Twenty-three unit tests and six browser UI tests passed.

Windows x64 is an unsigned preview. Native packaged-app checks do not constitute a clean-machine installer test. No new macOS/Linux binaries or signing are claimed. No guarantee of zero defects or complete worldwide hardware coverage is made. First Edition / 2026 remains the editorial edition, and the book was not changed.
