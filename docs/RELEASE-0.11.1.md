# Black Wire 0.11.1 — embedded reference controls

First Edition / 2026 · collection 2026.09.11 · Windows x64 preview, unsigned.

PDF page-number jumps and saving personal measurements now work inside the Shopify guide's restricted iframe. These local actions no longer depend on native form submission. Enter-key actions and required-field validation remain available; Enter in a notes field still inserts a newline. The store's iframe security permissions are unchanged.

Includes the [HaleHound and Elechouse reference intake](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.11.md) and Dagnazty's Black Wire theme from 0.11.0. The catalog and source artwork are unchanged in this patch. Earlier releases remain immutable.

Download the setup EXE and **both Black-Wire-Library-2026.09.11-part-XX.zip files** from this release into one folder. Keep the ZIPs unextracted and run setup. The library files are byte-for-byte identical to the 0.11.0 library; the installer checks their hashes before changing an existing installation. SHA256SUMS.txt covers all three files.

The Windows preview is unsigned. No new Linux or macOS binaries are provided. A full clean-machine installation and native application UI remain unverified. The [browser guide](https://valleytechsolutions.tech/pages/bwm-technical-reference-guide) requires no installation.

Regression coverage exercises PDF Go/Enter navigation, required-field validation, textarea newlines and both measurement-save actions inside an iframe with the store's actual sandbox policy.
