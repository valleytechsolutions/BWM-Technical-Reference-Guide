# Black Wire 0.8.0 / Jetson, NanoPi and I/O documentation

Collection 2026.09.8 adds 75 listings, populates eight previously empty records and adds 114 reference entries, including 15 physical pinout-image entries. FriendlyELEC NanoPi/NanoPC and carriers, NVIDIA Jetson developer kits, Raspberry Pi CM4/CM5 I/O boards, Olimex, RAK13002 and the Antmicro Orin carrier are included. [Intake and exact limits](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.8.md).

Every one of the 2,589 board/device and 501 maker listings now has explicit documentation coverage. Board datasheets, chip datasheets, hardware manuals, schematics and original websites are separate. This is an audit of recorded evidence: older unclassified documents do not automatically count as board datasheets. Missing sources remain visible. Saved PDFs open locally; links labeled online need a connection.

I/O & expansion shortcuts and the documentation wiki make this material easier to find. Search now matches punctuation inside codes such as RAK-13002 while preserving numeric model suffix boundaries. Original RAK SVG pin labels remain sharp when zoomed. The library totals 3,354 board reference entries and 1,511 pinout-image entries; supporting images are not counted as physical pinouts.

## Windows preview download

Download **Black-Wire-0.8.0-windows-x64-setup.exe** and **Black-Wire-Library-2026.09.8.zip** into the same folder. Keep the ZIP unextracted, then open the setup EXE from File Explorer. The installer checks the library SHA-256 before replacing an existing app and installs the full offline library. The content package is separate because the combined installer exceeded its size limit. SHA256SUMS.txt covers both downloads.

The installer is **unsigned** and may trigger Windows warnings. Native launch and clean-machine installation of this build are not verified. No new Linux or macOS binaries are claimed. Build targets remain available; use the web guide on those platforms until native releases are validated.

## Validation and remaining work

45 unit tests pass, including model search, documentation scope, source links, power calculations and PDF sizing. Catalog paths, original hashes, archive CRCs and private-data scans pass. The Windows installer rejects missing and mismatched archives before installation. Its actual hash-and-extraction macros also passed an isolated native test against the full library ZIP; that test writes only to a temporary work directory and is not a clean-machine app installation. Browser checks cover new references, saved PDFs, SVG rendering, source status and responsive layouts. Source availability is not independent all-pin or electrical validation.

Many listings still need an exact board datasheet, a physical pinout or a verified manufacturer page. No worldwide completeness is claimed. Manufacturer artwork retains its own rights. First Edition / 2026 remains the editorial edition; the book draft is unchanged.
