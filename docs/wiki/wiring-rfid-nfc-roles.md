# RFID / NFC: reader, writer or emulator?

Choose the radio, supported tag protocol and host interface before choosing wires.

**Applies to:** Capability planning for documented NFC parts. Reading, writing and card emulation are separate operations; chip features do not guarantee module firmware support.

## When to use it

Building tag-based identification, an NDEF demonstration or your own NFC test device.

## Why it works this way

RFID describes a broad family. A 13.56 MHz NFC module is not automatically compatible with 125 kHz or UHF tags.

![RFID / NFC: reader, writer or emulator? — Capability planning for documented NFC parts. Reading, writing and card emulation are separate operations; chip features do not guarantee module firmware support.](https://valleytech-black-wire-guide.pages.dev/library/wiring/rfid-nfc-roles.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/rfid-nfc-roles.svg)

## Connection reference

| Role / part | What to check | Practical implication |
| --- | --- | --- |
| Reader | Frequency and tag technology | Detection is not proof of application access |
| Writer | Writable memory, permissions and locks | A readable tag may not be writable |
| Card emulator | Supported card type and host stack | Not an automatic copy of another card |
| ST25R3916B | NFC frontend with host software | Do not transfer all features to 3917B/3919B |
| PN532 | Host mode and supported NFC modes | Module switches and voltage circuits vary |
| PN7160 | NCI controller and host application | Type-4 emulation needs the appropriate application |
| PN5180 | Exact silicon/firmware and NFC library | Use the relevant revision documentation |

## Make the connection

1. Identify the exact module, antenna, tag technology and intended read/write/emulation role.
2. Choose a supported host library and verify mode support before assembling the prototype.
3. Use known test tags and inspect results without assuming UID detection proves full interoperability.

## Check before powering

- Antenna matching and nearby metal affect operation; an arbitrary wire is not a drop-in antenna.
- Module supply input, I/O voltage and RF field configuration are different specifications.

## Matching module references

- [ST25R3916B NFC Module](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-st25r3916b) — original images and datasheets
- [ST25R3916B Mini NFC Module with Ultra-Slim External Antenna](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-st25r3916b-mini) — original images and datasheets
- [PN532 NFC RFID module V3](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-pn532-v3) — original images and datasheets
- [PN5180 NFC MODULE](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-pn5180) — original images and datasheets
- [PN7160 MINI V1 — I2C](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-pn7160-mini-v1-i2c) — original images and datasheets

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [STMicroelectronics: ST25R3916B / 3917B / 3919B datasheet](https://www.st.com/resource/en/datasheet/st25r3916b.pdf) — Feature comparison: protocol and card-emulation differences between suffixes; checked 2026-09-27
- [NXP: PN532/C1 datasheet](https://www.nxp.com/docs/en/nxp/data-sheets/PN532_C1.pdf) — Host interfaces and supported operating modes; checked 2026-09-27
- [NXP: PN7160 card emulation, AN13861](https://www.nxp.com/docs/en/application-note/AN13861.pdf) — Card emulation mode, NCI and host application responsibilities; checked 2026-09-27
- [NXP: PN5180 product documentation](https://www.nxp.com/products/PN5180) — NFC frontend, protocol support and host interface; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `242cd20b924637850feb3bb4c1f3194787ed1f3a0a7da0f79b9645e67f523df7`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=rfid-nfc-roles) · [All wiring guides](Wiring.md)
