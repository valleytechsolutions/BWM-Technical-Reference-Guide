# Black Wire 0.9.0 / Search and source audit

Search now keeps chip suffixes separate from display sizes, recognizes Unicode dashes in module names, and correctly applies the global physical-pinout filter before linked-record deduplication. Nine catalog names that disappeared in full-name searches are fixed. Bounded query caching, indexed linked-asset lookup and less work in hidden views improve responsiveness. In a local Node benchmark of the existing 3,090-record catalog, representative uncached searches fell from roughly 4–6 ms to 0.7–2.7 ms; cached repeats took 0.01–0.35 ms. This measures search functions, not page load or UI rendering. Run `node scripts/benchmark-search.mjs` to measure your machine.

Workbench imports reject duplicate measurement IDs and generate collision-free missing IDs, preventing imports that could make saved data unreadable. Merged catalog IDs preserve deep links, favorites and measurements. Library import removes retired managed files so they do not remain in native packages.

Collection **2026.09.9** adds ESP-Mosaico, P4X and FPGA references: six new records, one populated record and 24 references, including four physical pinout-image entries. One truncated source image was retired; two malformed import records were merged. [Detailed source audit and remaining gaps](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.9.md).

Document links now show availability checks separately from source/model review. **2,230 endpoints** are accounted for; six old model pages still return not found, and restricted, timed-out or deferred endpoints remain explicitly unverified. **ESP-Mosaico GPIO19 has a manufacturer-source discrepancy** retained in its scope notes. A responding URL is not proof of a complete or electrically verified datasheet.

## Windows preview

Download **Black-Wire-0.9.0-windows-x64-setup.exe** and **Black-Wire-Library-2026.09.9.zip** into the same folder. Keep the ZIP unextracted and run setup. The installer verifies the matching library before updating an existing installation. SHA256SUMS.txt covers both downloads. Older releases are retained unchanged.

This installer is **unsigned** and may trigger Windows warnings. Native app launch and full clean-machine installation are not verified. No new Linux or macOS binaries are claimed; the web guide works in their browsers and the reference collection can be read on all three platforms.

## Validation

54 unit tests, all 3,094 catalog-name searches, original hashes and manifest checks pass. The media sweep decoded/parsed 7,493 visuals without remaining errors; 18 non-visual files were separate. The dependency audit reported no known advisories. Browser verification covers model and pinout search, source status, image/PDF viewing, saved boards, power tools, wiki links and mobile layout. Package CRCs, privacy scans and the installer library preflight/extraction checks are recorded with the release validation.

Hardware completeness, independent pin verification, missing datasheets and native platform testing remain work in progress. First Edition / 2026 remains the editorial edition; the book draft is unchanged.
