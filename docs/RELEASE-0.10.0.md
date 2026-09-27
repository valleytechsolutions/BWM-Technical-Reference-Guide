# Black Wire 0.10.0 — Inland and manufacturer coverage

First Edition / 2026 · collection 2026.09.10 · Windows x64 preview, unsigned.

Adds 118 listings: 68 board/device records and 50 maker-module records. Inland now has 67 records spanning boards, shields, sensors, displays, radios and kits, with eight original physical pinout-image attachments. All 50 DFRobot MCU-category SKU pages were reviewed. The update also includes manufacturer GPIO sheets for two TI LaunchPads, Microchip AVR-IoT WG and Silicon Labs EFM32ZG-STK3200.

Exact SKUs, USB-C versus older boards, kit variants and conflicting manufacturer labels remain distinct. Photos, board labels, schematics, wiring examples and physical pinout sheets have separate labels. Missing sheets remain visible. [Detailed source coverage](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.10.md).

## Windows download

Download the setup EXE and **every Black-Wire-Library-2026.09.10-part-XX.zip** from this release into the same folder. Keep all ZIP parts unextracted and run the setup EXE. Setup verifies every part before replacing an existing installation. The library parts alone are not a portable application.

The collection has outgrown a single release file. Independent ZIP parts preserve all original media while keeping every download below GitHub's 2 GiB asset limit. SHA256SUMS.txt covers the installer and all library parts.

## Validation and limits

54 JavaScript unit tests, two multipart packaging regression tests, all 3,212 listing-name search checks, 7,851 manifest paths and 3,911 original-file hashes passed. All 291 added image/PDF files passed decoding or parsing. Source endpoint availability is separate from model and electrical review.

Browser checks passed for Inland SKU search, dashed DFRobot SKU search, source links, original pinout viewing, schematic PDFs and a 390-pixel viewport. No app-origin console errors were observed. An isolated native Windows harness rejected either missing ZIP part and a mismatched second part before modifying its existing-install sentinel, then extracted both valid parts; all 7,852 files matched the imported library byte-for-byte. Public text and generated-web secret scans found no leaks. Full clean-machine installation and native app launch of this build remain unverified. This Windows preview is unsigned; signing and SmartScreen trust are not claimed. No new Linux or macOS binaries are published. The browser guide works without installing the desktop app.

Inland historical products, DFRobot's wider 807-product research queue and Mouser's broad catalog still need further research. No complete brand or worldwide inventory is claimed. The Power Desk gained no unverified electrical ratings. The book draft was not edited.
