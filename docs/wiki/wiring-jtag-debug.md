# JTAG: TCK, TMS, TDI and TDO

Understand the four core JTAG signals and their direction at a target.

**Applies to:** Single-target signal diagram. Pin order, voltage and optional reset signals depend on the exact probe and connector.

## When to use it

Using supported programming, debugging or boundary-scan tools with documented target hardware.

## Why it works this way

Separate clock, state control and serial input/output let a probe communicate with a target's test-access port.

![JTAG: TCK, TMS, TDI and TDO — Single-target signal diagram. Pin order, voltage and optional reset signals depend on the exact probe and connector.](https://valleytech-black-wire-guide.pages.dev/library/wiring/jtag-debug.svg)

[Open / save the original SVG](https://valleytech-black-wire-guide.pages.dev/library/wiring/jtag-debug.svg)

## Connection reference

| Target signal | Direction at target | Purpose |
| --- | --- | --- |
| TCK | Input | Clock |
| TMS | Input | State selection |
| TDI | Input | Serial data in |
| TDO | Output | Serial data out |

## Make the connection

1. Match the target connector and I/O voltage; identify optional nTRST and system reset separately.
2. For multiple targets, use the documented chain order and instruction-register configuration.

## Check before powering

- Do not assume that a similarly sized header is JTAG.
- Do not connect a probe's power-output contact unless the board and probe documentation explicitly allow it.

## Matching module references

This is a general interface guide; match your own hardware documentation.

## Sources & review

Source documents inspected; independent electrical and bench review pending. Reviewed 2026-09-27.

- [SEGGER: J-Link interface description](https://www.segger.com/products/debug-probes/j-link/technology/interface-description/) — 20-pin JTAG signal direction and VTref; checked 2026-09-27

Original writing and diagram by Kal / Valleytech Solutions, CC BY 4.0. Manufacturer artwork and documentation retain their own rights.

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · SHA-256: `b5c8e670c2135bf8572589c08071c3c57c0e6f84a06b08efd8ae43f413888f80`

[Open the interactive guide](https://valleytech-black-wire-guide.pages.dev/?tab=wiring&guide=jtag-debug) · [All wiring guides](Wiring.md)
