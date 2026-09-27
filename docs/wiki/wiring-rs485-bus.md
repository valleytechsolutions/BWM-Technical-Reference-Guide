# RS-485: a half-duplex multidrop bus

Connect differential transceivers on a bus with controlled transmit direction.

**Applies to:** Two-wire half-duplex topology with a transceiver at every node. RS-485 itself does not define Modbus addresses or a universal connector.

## When to use it

Linking compatible industrial sensors or controllers along a cable.

## Why it works this way

Differential signaling supports useful noise rejection; an application protocol decides who talks and what bytes mean.

![RS-485: a half-duplex multidrop bus — Two-wire half-duplex topology with a transceiver at every node. RS-485 itself does not define Modbus addresses or a universal connector.](https://valleytech-black-wire-guide.pages.dev/library/wiring/rs485-bus.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/rs485-bus.svg)

## Connection reference

| Signal / feature | Purpose | Check |
| --- | --- | --- |
| Differential pair | Shared data bus | A/B and +/- names can differ |
| DE | Enable the driver | Only one transmitter active at a time |
| /RE | Enable the receiver when low | Automatic-direction modules vary |
| Termination | Match cable impedance at both ends | Do not add one per node |
| Bias / failsafe | Defined idle state | Calculate for the complete loaded bus |

## Make the connection

1. Use a trunk with short stubs and the cable/transceiver guidance for the chosen rate.
2. Plan the signal reference, common-mode limits and isolation before connecting separate power systems.
3. Check transmit-enable timing and the protocol settings.

## Check before powering

- GPIO cannot directly drive the differential pair.
- Termination and bias are different circuits; modules may already contain either.

## Matching module references

This is a general interface guide; match your own hardware documentation.

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [Texas Instruments: RS-485 Design Guide, SLLA272D](https://www.ti.com/lit/an/slla272d/slla272d.pdf) — Sections on topology, termination, failsafe and grounding; checked 2026-09-27
- [Analog Devices: AN-960 RS-485/RS-422 implementation](https://www.analog.com/en/resources/app-notes/an-960.html) — Driver enable and half-duplex bus connections; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `38ead3cb8203d27fc2ea439d17ee104f1ca22470e53df421fe46f9393403aa7f`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=rs485-bus) · [All wiring guides](Wiring.md)
