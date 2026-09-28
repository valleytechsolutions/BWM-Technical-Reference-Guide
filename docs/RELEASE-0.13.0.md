# Black Wire 0.13.0 — Radio references and gesture zoom

Pinch to enlarge a reference, then drag to the connector you need. Image and PDF viewers now support two-finger pinch, pointer dragging, trackpad Ctrl+wheel, double-click/double-tap and focused-viewer keyboard controls. The existing buttons remain available, with a 25–600% range. PDF rendering keeps the previous page visible while a bounded-resolution canvas is refreshed.

Collection **2026.09.13** adds 34 board/module records and enriches 12 existing records: RAKwireless, Heltec, Elecrow, Seeed Studio, H4M Pro, ESP32-MDK, Hat Labs, LOLIN and REYAX. The 104 new attachments include 25 physical pinout images, with source PDFs, connector tables, schematics and identification pictures labeled separately. There are 164 additional sourced pin-function rows.

[Coverage and remaining gaps](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.13.md) · [Viewer controls](https://valleytech-black-wire-guide.pages.dev/wiki/reference-viewer/) · [Radio reference guide](https://valleytech-black-wire-guide.pages.dev/wiki/radio-and-gpio-references/)

Source tests and browser regression cover touch pinch in/out, mouse panning, Ctrl+wheel, keyboard, zoom reset between references and PDF canvas limits. Automated touch checks use Chromium emulation; physical iOS/macOS trackpads and touch hardware have not been independently verified. First Edition / 2026 and the book draft remain unchanged. This update does not establish complete worldwide coverage or new independently tested power limits.

## Windows preview

Download the installer **and both matching library ZIP parts** into the same directory. Leave the parts unextracted and run setup. Each part is bound to the installer by SHA-256; older releases remain unchanged.

The Windows x64 preview is unsigned and may trigger operating-system warnings. A full clean-machine installation and native UI are not independently verified. No new macOS or Linux binaries are included; the browser guide works without installation.

Original code is MIT. Original guide text is CC BY 4.0, credited to Kal / Valleytech Solutions. Source artwork and documents retain their own rights and attribution.
