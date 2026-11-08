# Black Wire 0.16.4 — November hardware reference update

Collection **2026.11.1** adds **15 new listings, 3 updated listings and 33 references, including 9 physical pinout images** across 18 reviewed records. **First Edition / 2026** remains the editorial edition. The digital snapshot and app version are separate from a future physical-book edition.

The November 7 addition includes the user-supplied **Cerberus by 463n7.io** J1/J2 physical-header pinout, searchable under both ESP32-S3 and ESP32-C5 and in Devices & IoT. The original image is unchanged; the board revision and artwork permissions remain explicitly unresolved. Manufacturer specifications are linked separately.

Physical references include ESP32-S31-Zero, WT9932P4C61-TINY, WT9932P4-TINY, TinyC6[D], TinyPICO[D], Unexpected Maker TinyPICO NANO, Tang Nano, Tang Nano 9K, Cerberus Development Board. Supporting PCB labels, connector diagrams, schematics and manuals keep their separate scopes. Some additions are older omissions or new documentation for existing hardware; no worldwide completeness or universal launch-date claim is made. Original source attribution, revisions, rights and unresolved gaps are retained. Pin assignments have not been independently electrically tested.

## Initial catalog loading

The initial browsing catalog omits detailed ingestion-provenance objects while retaining source links, creator credits, rights, review notes and file hashes used by the viewer. Full provenance remains in the original `library/catalog.json`. Connector pin lists load on demand for the breadboard. This reduces initial catalog loading without discarding the reference collection's provenance or changing original images and PDFs.

## Update an installed app

1. Open **Updates & offline library → Check for updates**.
2. Choose **Download update**, then **Restart & update**.
3. Use **Download offline library** to cache the new references. Unchanged verified files are reused; workbench data stays outside the installation.

Users on 0.13 or earlier need the current installer once to gain in-app updates. Windows setup is one file; separate collection ZIP parts are not required. Original images and PDFs download inside the app. Leave space for the app, original references, update workspace, retained caches and any legacy-library migration. Manufacturer website links require internet.

## Native validation and platform status

All **143 source tests** passed in the recorded candidate validation.

The [native installer/update workflow](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/42432354444) passed on **windows-2022, windows-2025, ubuntu-22.04, ubuntu-24.04**. Checks common to all recorded reports: failed update check recovery; fresh package install; native sandboxed launch; offline cache persistence; on-demand image and PDF checksum; real update download; real update install and automatic relaunch; workbench persistence. Per-platform checks are preserved in `native-validation.json`. These runner checks do not claim testing on every Windows machine or Linux distribution.

The older update fixture is this candidate packaged as QA-only 0.13.99; it is not a separately published older release. Runtime build commit: `6e161642ce5285c5e3f976b972e2ceddf995b03b`. Collection commit: `5b96da1ff54c7adcb6907fbcb1698e367de79ecc`. Later documentation-only edits do not alter the tested runtime.

Release assets are the exact tested Windows x64 setup and blockmap, Linux amd64 DEB, `latest.yml`, `latest-linux.yml`, `SHA256SUMS.txt` and `native-validation.json`. Publication uses a normal release, not a prerelease. The current Gitea mirror is pending; GitHub is the canonical download and updater host.

Windows is **unsigned** and may display reputation warnings. Linux native evidence covers only the environments above. **No newly validated macOS installer or AppImage is included.** Older releases remain immutable.

[Install and update](DOWNLOADS.md) · [Source register and documentation gaps](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.11.1.md)
