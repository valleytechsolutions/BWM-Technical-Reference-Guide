# Wiring & protocols

Original connection diagrams, signal tables, practical checks and manufacturer sources. These guides are distinct from physical board pinouts and are not bench certifications.

- [RJ45 / 8P8C Ethernet: T568A and T568B](wiring-ethernet-t568.md) — Match numbered contacts and twisted pairs when terminating Ethernet cable.
- [Phone jacks: RJ11, RJ14 and USOC terminals](wiring-telephone-jacks.md) — Recognize telephone connector families and a documented screw-terminal conversion.
- [UART: TX, RX and a shared reference](wiring-uart-logic.md) — Connect a logic-level serial adapter to a compatible board console.
- [RS-232: put a transceiver between UART and cable](wiring-rs232-interface.md) — Understand why an RS-232 port cannot connect straight to a logic-level UART.
- [RS-485: a half-duplex multidrop bus](wiring-rs485-bus.md) — Connect differential transceivers on a bus with controlled transmit direction.
- [CAN bus: controller, transceiver and termination](wiring-can-bus.md) — Separate the MCU's CAN signals from the two-wire physical bus.
- [I2C: two shared lines with pull-ups](wiring-i2c-bus.md) — Wire SDA and SCL for compatible sensors on a short local bus.
- [SPI: clock, data direction and chip select](wiring-spi-bus.md) — Connect a host to a four-wire SPI peripheral without crossing the data roles.
- [SWD: connect a Cortex debug probe](wiring-swd-debug.md) — Map the essential debug signals without confusing voltage sense with a power output.
- [JTAG: TCK, TMS, TDI and TDO](wiring-jtag-debug.md) — Understand the four core JTAG signals and their direction at a target.
- [RFID / NFC: reader, writer or emulator?](wiring-rfid-nfc-roles.md) — Choose the radio, supported tag protocol and host interface before choosing wires.
- [ELECHOUSE ST25R3916B: SPI wiring](wiring-st25r3916b-spi.md) — Signal connections for the seven-pin module in the V0.3 Draft datasheet.
- [ELECHOUSE ST25R3916B: I2C wiring](wiring-st25r3916b-i2c.md) — The same module changes pin functions after hardware mode selection.
- [ELECHOUSE PN7160 MINI V1: I2C wiring](wiring-pn7160-mini-i2c.md) — Wire the six-pin MINI module without borrowing the standard module's eight-pin map.
- [ELECHOUSE PN532 V3: choose the host mode](wiring-pn532-v3-modes.md) — Select UART, I2C or SPI before following that interface's wiring diagram.

[Open the wiring desk](https://valleytech-black-wire-guide.pages.dev/?tab=wiring)
