# ELECHOUSE PN7160 MINI V1: I2C wiring

Wire the six-pin MINI module without borrowing the standard module's eight-pin map.

**Applies to:** ELECHOUSE PN7160 MINI V1 I2C only. Identify contact 1 using the manufacturer drawing, not cable colors.

## When to use it

Connecting the PN7160 MINI V1 I2C module to a compatible 3.3 V host.

## Why it works this way

I2C transfers commands; IRQ reports events and VEN controls enable/reset.

![ELECHOUSE PN7160 MINI V1: I2C wiring — ELECHOUSE PN7160 MINI V1 I2C only. Identify contact 1 using the manufacturer drawing, not cable colors.](https://valleytech-black-wire-guide.pages.dev/library/wiring/pn7160-mini-i2c.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/pn7160-mini-i2c.svg)

## Connection reference

| Contact | Signal | Host role |
| --- | --- | --- |
| 1 | SDA | I2C data |
| 2 | SCL | I2C clock |
| 3 | IRQ | Interrupt input |
| 4 | VEN | Enable output |
| 5 | VCC | Module supply |
| 6 | GND | Ground |

## Make the connection

1. Use the documented 3.3-5.5 V supply range at VCC, including ripple and tolerance. Host signals remain 3.3 V.
2. Set the library's supply preset to the actual supply before configuring the NFC controller.
3. Select a supported NCI example and connect the specified antenna.

## Check before powering

- Do not substitute the PN7161 MINI SPI or standard PN7160 eight-pin wiring.
- Reader operation does not automatically implement an emulated card application.

## Matching module references

- [PN7160 MINI V1 — I2C](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-pn7160-mini-v1-i2c) — original images and datasheets

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [ELECHOUSE PN7160 MINI V1 I2C datasheet](https://www.elechouse.com/docs/pn7160-mini-v1-i2c/datasheet.html) — Six-pin host connector and supply/logic distinction; checked 2026-09-27
- [ELECHOUSE PN7160 MINI V1 quick start](https://www.elechouse.com/docs/pn7160-mini-v1-i2c/quick-start.html) — Host connections and supply-dependent software preset; checked 2026-09-27
- [NXP: PN7160 card emulation, AN13861](https://www.nxp.com/docs/en/application-note/AN13861.pdf) — Card emulation mode, NCI and host application responsibilities; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `eae440b8bfabf52a62c3c320e97354ac5eb895b0ec632327b0e22814c55536ad`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=pn7160-mini-i2c) · [All wiring guides](Wiring.md)
