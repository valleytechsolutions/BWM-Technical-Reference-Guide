# I2C: two shared lines with pull-ups

Wire SDA and SCL for compatible sensors on a short local bus.

**Applies to:** Ordinary open-drain I2C. Connector-branded systems still require their own pinout and voltage check.

## When to use it

Connecting addressed peripherals while using few MCU pins.

## Why it works this way

Devices share data and clock lines and release them high through pull-up resistors.

![I2C: two shared lines with pull-ups — Ordinary open-drain I2C. Connector-branded systems still require their own pinout and voltage check.](https://valleytech-black-wire-guide.pages.dev/library/wiring/i2c-bus.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/i2c-bus.svg)

## Connection reference

| Signal | Connection | Purpose |
| --- | --- | --- |
| SDA | SDA on each device | Bidirectional data |
| SCL | SCL on each device | Clock; a target may stretch it |
| GND | Common reference | Non-isolated example |
| Pull-up rail | Compatible with every I/O | Not automatically the module power input |

## Make the connection

1. Check addresses for collisions and configure the documented bus speed.
2. Determine the total pull-up resistance from all attached boards.
3. Choose resistance using rise-time, capacitance and sink-current limits; 4.7 kohm is not universal.

## Check before powering

- A 5 V pull-up can damage a non-tolerant 3.3 V input.
- Do not cross SDA and SCL. A detected address alone does not prove the correct device or power configuration.

## Matching module references

This is a general interface guide; match your own hardware documentation.

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [NXP: I2C specification, UM10204](https://www.nxp.com/docs/en/user-guide/UM10204.pdf) — SDA/SCL, open-drain bus, addressing and pull-up sizing; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `a7b801ab586b24a37d9650a55c6f8fcb29dd7ae65d3d572c80e040b30eff0dce`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=i2c-bus) · [All wiring guides](Wiring.md)
