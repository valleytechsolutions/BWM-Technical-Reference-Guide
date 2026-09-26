<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/black-wire-red.png"><img src="docs/brand/black-wire.png" width="110" alt="Black Wire logo"></picture> &nbsp;&nbsp;
  <img src="docs/brand/valleytech.png" width="80" alt="Valleytech Solutions logo">
</p>
<h1 align="center">The Black Wire Maker's<br>Technical Reference Guide</h1>
<p align="center"><strong>Know your board. Make the connection.</strong><br>A Valleytech Solutions project, made for the workbench.</p>
<p align="center">Makers · Educators · Students · Hobbyists · Engineers</p>

<p align="center"><a href="https://github.com/valleytechsolutions/black-wire-desktop/releases">Downloads & release status</a> · <a href="https://github.com/valleytechsolutions/black-wire-pinouts">Browse the pinout collection</a> · <a href="docs/BUILDING.md">Build the app</a> · <a href="CONTRIBUTING.md">Contribute</a></p>
<p align="center"><img alt="Edition" src="https://img.shields.io/badge/edition-First_Edition_2026-d5f58a?style=flat-square&labelColor=17211f"> <img alt="Offline" src="https://img.shields.io/badge/reference_library-offline-d5f58a?style=flat-square&labelColor=17211f"> <img alt="Platforms" src="https://img.shields.io/badge/targets-Windows_%7C_Linux_%7C_macOS-d5f58a?style=flat-square&labelColor=17211f"></p>

![Black Wire board library, with manufacturer and microcontroller filters](docs/screenshots/library.png)

## Open the reference workbench

**[Use the web app](https://valleytech-black-wire-guide.pages.dev/) · [Read the wiki](https://valleytech-black-wire-guide.pages.dev/wiki/) · [Download Windows](https://github.com/valleytechsolutions/black-wire-desktop/releases/latest)**

Find **ESP32, Arduino, Raspberry Pi, RP2040/RP2350, board pinouts, OLED/LCD/e-paper displays, sensors and maker modules**. Search the exact model, inspect the original source, check its revision and keep useful boards saved locally. Hardware coverage and missing documentation are explicit.

## New in 0.7.0

- **More manufacturer references:** 107 additional board/device listings, 229 reference entries and 15 linked maker records, including Adafruit, SparkFun, FPGA boards, H4M, LattePanda and Milk-V Mars.
- **SBC and FPGA shortcuts:** browse single-board computers together, then filter ARM, x86 or RISC-V. Mixed-architecture boards appear under either matching architecture.
- **Specifications close to the diagram:** visible links to manufacturer hardware documentation, with dedicated specs distinguished from general sources.
- **A new SBC wiki guide** and corrected model identities. [Release details and limits](docs/RELEASE-0.7.0.md).

![LattePanda IOTA GPIO reference with hardware documentation links](docs/screenshots/lattepanda-reference.png)

## Previous update / 0.6.1

- PDF touch scrolling, intrinsic page rotation, direct page selection and retry after a failed load. High zoom uses a bounded canvas allocation.
- Zoomed, rotated images keep all corners reachable; malformed saved measurements cannot crash the workbench or overwrite saved data.
- Two newly tracked SparkFun ESP32 models and eight source reference entries in collection **2026.09.6**. [Verification and remaining limits](docs/RELEASE-0.6.1.md).

## Introduced in 0.6.0

- **Dark mode by default:** warm charcoal, gold highlights and the official red Black Wire logo. Light mode uses a warm paper palette; your choice persists locally.
- **A redesigned workbench:** a circuit-inspired opening panel, consistent controls and readable dark viewers, tables and power tools. Reference images keep their original colors.
- **A public reference wiki:** eight practical guides and catalog directories for every current board and maker listing. The wiki works without JavaScript; directory filtering is an optional enhancement.
- **Better discovery:** useful titles and descriptions, canonical links, social previews and a sitemap. GitHub wiki pages and issue templates make corrections and contributions easier.
- **Useful edge-case fixes:** saved theme synchronization across tabs, a clear fallback when storage is blocked, and direct links to undocumented board records.

The current collection is **2026.09.7**: 2,514 board/device listings and 501 maker listings, including families and shared records. A physical source is not an independently approved all-pin reference. [Coverage audit](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/PINOUT_COVERAGE.md).

## Your board. Its pins. One place.

Black Wire is an offline desktop workbench for the moment you need to know **what that pin does**. Find the exact board, open its original pinout, check its revision and source, and keep the references you use most within reach.

Built for a student's first breadboard, an educator's lab, a hobbyist's parts drawer and an engineer's prototype bench.

| At your bench | What the app does |
|---|---|
| Find the right board | Search names, aliases and filenames; filter manufacturer, MCU variant, family and review status. Dashes, spaces and underscores work interchangeably. |
| Find a maker device | Dedicated Devices & IoT tab with 313 device records, category filters, exact model references and visible documentation gaps. |
| Read the details | Zoom, pan and rotate diagrams; browse local PDFs; save the original-resolution file. |
| Check the source | Keep source links, revision notes, coverage labels and hashes with each reference. |
| Plan power | Read sourced voltage/current profiles and published observations; compare adapter ratings, estimate battery runtime and total power across voltage rails. |
| Keep your work | Save boards and your own measurements locally; import/export JSON backups. |
| Stay offline | The desktop reference library is bundled locally. External source, wiki and YouTube links open only when selected. No account or cloud sync. |

### A growing library

**3,240 reference entries · 1,496 board pinout source image entries · 64 brands/source groups.** There are 1,806 populated catalog records, including shared references and unreviewed source products. This is a collection snapshot, not a claim to cover every board ever made.

ESP32 variants including C5/C6/S3, RP2040/RP2350, CYD displays, Arduino, Teensy, Raspberry Pi, other SBCs, radio boards and GPIO devices are indexed separately where their identities are known. Chip-package references are labeled separately from board pinouts.

## Devices & IoT

![Device categories, search and original pinout images](docs/screenshots/devices-iot.png)

Browse handhelds, radios, wearables, displays, cameras and controllers. Search T-Embed, T-Beam, Cardputer or Flipper Zero using the same dash-tolerant search. In-development documentation is labeled; missing pinout images stay in a documentation-watch list.

The guide is **First Edition / 2026**, with digital collection snapshot **2026.09.7**. App updates and collection snapshots do not advance the annual book edition. See [publication workflow](docs/MAINTENANCE.md).

## Look closer

![Pinout viewer with original source and revision details](docs/screenshots/pinout-viewer.png)

Original images stay intact. Partial maps and unknown revisions remain visible so users can compare the reference with the board on their bench.

![Power desk with sourced voltage and current observations](docs/screenshots/power-desk.png)

The power desk includes **13 sourced profiles and 22 published operating observations**. Manufacturer requirements, nominal values, published measurements and personal bench readings are distinct. Unknown values stay unknown. Published observations were not measured by Black Wire; a typical current reading is not a guaranteed maximum or a supply recommendation.

## Download and open

Check [Releases](https://github.com/valleytechsolutions/black-wire-desktop/releases) for the actual available assets and validation status. An absent platform asset means that platform has not been released.

**Available now: [Windows x64 preview 0.7.0](https://github.com/valleytechsolutions/black-wire-desktop/releases/tag/v0.7.0).** Linux and macOS build targets are provided, but verified downloads for those systems have not been published. For images and PDFs without an application, use the separate [pinout collection releases](https://github.com/valleytechsolutions/black-wire-pinouts/releases); those ZIP files can be read on all three operating systems.

| Platform | Current status |
|---|---|
| Windows x64 | 0.7.0 unsigned preview. Browser and library checks cover this update; clean-machine installation and native launch validation of this build remain outstanding. |
| Linux x64 / ARM64 | Packaging supported; native launch validation remains outstanding. |
| macOS Intel / Apple Silicon | Build targets provided; a Mac, Developer ID signing and notarization are needed for a distributable release. No verified Mac binary is claimed. |

For Windows, download the complete installer from a release, then open it from File Explorer. It creates desktop and Start menu shortcuts and keeps the reference library with the app. Portable ZIP users must extract **all** files before opening the application. Do not move a lone EXE out of its folder.

Read [DOWNLOADS.md](docs/DOWNLOADS.md) for checksums, signing status and security warnings. A checksum checks download integrity; it does not replace a trusted publisher signature. Preview builds may still trigger Windows warnings.

## Browser edition for the Valleytech store

**[Open BWM-Technical Reference Guide on the Valleytech store](https://valleytechsolutions.tech/pages/bwm-technical-reference-guide)** — or [open the guide full screen](https://valleytech-black-wire-guide.pages.dev/).

The complete current catalog is available in your browser. Search, view pinouts/PDFs and use power tools without installing an app. References load on demand; browser bookmarks and measurements stay local. The live Shopify embed has been checked on desktop and phone widths. The desktop edition remains available for offline use.

See [Website integration](docs/WEBSITE.md) for the prepared page, build commands and hosting requirements.

![Browser edition of the guide](docs/screenshots/browser-guide.png)

## Two repositories, one field guide

- **[black-wire-pinouts](https://github.com/valleytechsolutions/black-wire-pinouts):** images, PDFs, catalog, board pages and per-reference attribution.
- **This repository:** desktop application, power data, UI screenshots, tests and packaging. Large library files are imported during a build; personal bookmarks and measurements are never part of the repository.

See [Build and development](docs/BUILDING.md), [Workbench guide](docs/WORKBENCH.md), [Attribution](ATTRIBUTION.md) and [Contribution guide](CONTRIBUTING.md).

## Attribution and project status

Original board artwork belongs to its credited authors/manufacturers. This application does not claim ownership or grant new permissions over those references. See the collection's [per-asset ledger](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/catalog/attributions.csv) before reuse. **Original app code: [MIT](LICENSE)** — reuse and modify, including commercially, while retaining the copyright and permission notice. **Original guide material: CC BY 4.0** — reuse with attribution, a license link and a note of changes. See [license scope](LICENSING.md), [creator credit](NOTICE.md) and [privacy](PRIVACY.md). These licenses do not relicense manufacturer diagrams.

First Edition is a growing digital collection for a lasting maker reference. The public wiki is available; annual print editions are a future project, with separate completeness, rights and print-quality reviews.

---
Created and curated by **—your pal kal** · [@valleytechsolutions on YouTube](https://www.youtube.com/@valleytechsolutions)

Black Wire and Valleytech logos belong to their creator. Manufacturer names and trademarks identify the referenced hardware; they do not imply endorsement.
