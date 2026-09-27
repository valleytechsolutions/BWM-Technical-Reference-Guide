# ELECHOUSE ST25R3916B: I2C wiring

The same module changes pin functions after hardware mode selection.

**Applies to:** Same V0.3 Draft module as the SPI guide. Change the I2C solder bridge only with power removed.

## When to use it

Using the seven-pin module in the documented I2C configuration.

## Why it works this way

SDA is on contact 5, not contact 4.

![ELECHOUSE ST25R3916B: I2C wiring — Same V0.3 Draft module as the SPI guide. Change the I2C solder bridge only with power removed.](https://valleytech-black-wire-guide.pages.dev/library/wiring/st25r3916b-i2c.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/st25r3916b-i2c.svg)

## Connection reference

| Contact | I2C role | Connection |
| --- | --- | --- |
| 1 | IRQ | Host interrupt input |
| 2 | Unused in standard I2C wiring | Leave unconnected |
| 3 | SCL | Host SCL |
| 4 | Unused in standard I2C wiring | Leave unconnected |
| 5 | SDA | Host SDA |
| 6 | 5V | Module supply |
| 7 | GND | Ground |

## Make the connection

1. Verify the mode bridge and use an I2C-capable host library.
2. Account for onboard pull-ups before adding external ones.

## Check before powering

- This assignment is not valid for every ST25R module.

## Matching module references

- [ST25R3916B NFC Module](https://valleytech-black-wire-guide.pages.dev/?tab=makers&part=elechouse-st25r3916b) — original images and datasheets

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [ELECHOUSE ST25R3916B module, V0.3 Draft](https://www.elechouse.com/wp-content/uploads/2026/07/ST25R3916B_NFC_Module_Datasheet.pdf) — Page 4: seven-pin connector, power and SPI/I2C mode selection; checked 2026-09-27
- [NXP: I2C specification, UM10204](https://www.nxp.com/docs/en/user-guide/UM10204.pdf) — SDA/SCL, open-drain bus, addressing and pull-up sizing; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `28495c623b1e4850733ee5ffc07112e457cb2e474892af81186fe861b17c06c9`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=st25r3916b-i2c) · [All wiring guides](Wiring.md)
