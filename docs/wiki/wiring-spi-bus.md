# SPI: clock, data direction and chip select

Connect a host to a four-wire SPI peripheral without crossing the data roles.

**Applies to:** Conventional four-wire, active-low-CS SPI. Three-wire, daisy-chain and device-specific interfaces need their own diagrams.

## When to use it

Using supported displays, memory, ADCs or radio/NFC frontends.

## Why it works this way

A shared clock times the transfer, and chip select identifies the active peripheral.

![SPI: clock, data direction and chip select — Conventional four-wire, active-low-CS SPI. Three-wire, daisy-chain and device-specific interfaces need their own diagrams.](https://valleytech-black-wire-guide.pages.dev/library/wiring/spi-bus.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/spi-bus.svg)

## Connection reference

| Mode | CPOL | CPHA |
| --- | --- | --- |
| 0 | 0 | 0 |
| 1 | 0 | 1 |
| 2 | 1 | 0 |
| 3 | 1 | 1 |

## Make the connection

1. Match I/O levels, SPI mode, bit order and maximum clock to the peripheral datasheet.
2. Check that shared MISO devices release the line when deselected.
3. Start with short wires and a conservative clock.

## Check before powering

- SDI/SDO labels are local to the device. Read each signal direction.
- Supply wiring and optional IRQ/reset signals are additional to the four SPI signals.

## Matching module references

This is a general interface guide; match your own hardware documentation.

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [Analog Devices: Introduction to SPI Interface](https://www.analog.com/en/resources/analog-dialogue/articles/introduction-to-spi-interface.html) — Interface, signal direction and CPOL/CPHA table; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `5232f621f0b93104e041b3032a1f339bf244e7dc721a7cf8b7b80a885e3daa02`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=spi-bus) · [All wiring guides](Wiring.md)
