# ELECHOUSE PN532 V3: choose the host mode

Select UART, I2C or SPI before following that interface's wiring diagram.

**Applies to:** V3 manual revision B, 2013-11-05. Switch settings are not transferable to V4, MINI, USB or unbranded boards.

## When to use it

Identifying a documented ELECHOUSE V3 module for an NFC prototype.

## Why it works this way

The same header labels can have different roles in different modes.

![ELECHOUSE PN532 V3: choose the host mode — V3 manual revision B, 2013-11-05. Switch settings are not transferable to V4, MINI, USB or unbranded boards.](https://valleytech-black-wire-guide.pages.dev/library/wiring/pn532-v3-modes.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/pn532-v3-modes.svg)

## Connection reference

| Host mode | Switch 1 | Switch 2 |
| --- | --- | --- |
| HSU / UART | OFF | OFF |
| I2C | ON | OFF |
| SPI | OFF | ON |

## Make the connection

1. Identify the V3 board and numbered switches from the original reference.
2. Choose one interface, power-cycle after changing it, and use the corresponding library configuration.
3. Follow the exact header map and verify supply and I/O levels separately.

## Check before powering

- This guide does not approve the legacy manual's broad voltage-tolerance wording for every pin.
- NFC radio/card mode is separate from the UART/I2C/SPI host mode.

## Matching module references

- [PN532 NFC RFID module V3](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-pn532-v3) — original images and datasheets

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [ELECHOUSE PN532 V3 user manual, revision B](https://www.elechouse.com/elechouse/images/product/PN532_module_V3/PN532_%20Manual_V3.pdf) — Pages 3-5: interface switches and headers; not valid for other PN532 boards; checked 2026-09-27
- [NXP: PN532/C1 datasheet](https://www.nxp.com/docs/en/nxp/data-sheets/PN532_C1.pdf) — Host interfaces and supported operating modes; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `39f47978d840c0ee28319db3d0e35ee1ee9d9997b3b1df22eced94798e127ff4`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=pn532-v3-modes) · [All wiring guides](Wiring.md)
