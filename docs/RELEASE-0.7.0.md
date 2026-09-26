# Black Wire 0.7.0 / manufacturer and SBC expansion

Find more exact hardware references without leaving the workbench: collection 2026.09.7 adds 107 board/device listings, 229 reference entries, 127 physical pinout-image entries and 15 linked maker records. Adafruit, SparkFun, FPGA boards, PortaPack H4M, LattePanda and Milk-V Mars are included. [Source intake and limits](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.7.md).

SBC and FPGA shortcuts complement manufacturer/processor search. Architecture filters distinguish ARM, x86 and RISC-V, including mixed-architecture records. Unknown architectures remain available without filtering. Specifications and hardware-source links are visible in board and maker dialogs, including records whose pinout is missing. The wiki includes an SBC guide, direct hardware links and the actual package version.

The library holds 2,514 board/device listings, 501 maker listings, 3,240 board reference entries and 1,496 pinout-image entries. Partial connector maps, supporting photos, spreadsheets and schematics retain their separate labels. No worldwide completeness or all-pin approval is claimed.

The Power Desk now exposes input-specific notes and individual observation sources. Adapter comparisons start without assumed ratings, support A/mA, lock recorded operating bounds, and clear confirmations after edits. Battery estimates include usable energy and optional low-voltage current; power budgets reject overflow and explain conversion losses. Thirteen manufacturer profiles and 22 published observations were rechecked; these are not independent Black Wire electrical tests. The wiki includes a Power Desk guide.

## Validation and distribution

40 unit tests passed, including punctuation-aware search, source URL handling, SBC/mixed-architecture filtering, saved-data validation, power calculations, profile validation and PDF sizing. Library manifest paths and original hashes passed validation. Browser checks cover the new filters, specifications links, image/PDF views and narrow layouts. Release assets carry SHA-256 checksums.

The Windows x64 installer bundles the offline library and is unsigned. Native launch and clean-machine installation of this build are not verified. No new macOS or Linux binaries are claimed. Existing versions remain immutable. First Edition / 2026 remains the editorial edition; the book draft was not changed.
