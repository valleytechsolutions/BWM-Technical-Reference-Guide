# New hardware and source checks

Find ESP-Mosaico, P4X boards and FPGA references while keeping availability, revisions and unresolved evidence visible.

## The September source sweep

Collection 2026.09.9 adds ESP-Mosaico CoreBoard V1.0, ESP32-P4X-C5-Function-EV-Board, ESP32-P4X-EYE, ELM11 Feather, Atum A3 Nano and CycloMod, and fills the P4X-Function-EV-Board record. It corrects nine processor categories, two malformed import labels and retired documentation paths. Old links to merged records still resolve.



## ESP-Mosaico needs a revision check

The guide retains Espressif’s CoreBoard V1.0 schematic, H1/H2 connector schematics and pin-function tables. These connector symbols are supporting references, not physical board pinout photographs. H1 is rotated relative to H2 and shares audio signals. The H2 GPIO19 analog capability differs between the source table and connector schematic; that conflict remains visible for manufacturer clarification.

[Open ESP-Mosaico](https://valleytech-black-wire-guide.pages.dev/?board=espressif-esp-mosaico) · [Espressif hardware guide](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s31/esp-mosaico/user_guide.html)

## Upcoming is not guaranteed availability

ELM11 Feather is listed for pre-order by its creator. Its three pinout images apply to different FPGA overlays: 00002, 00003 and 00013. Match the configured overlay as well as the physical board. CycloMod’s campaign is gathering interest; its board image and block diagram are saved, but a physical MicroMod connector pinout and board datasheet still need collection. Atum A3 Nano’s JP1 map is a manufacturer manual reference, not an upcoming-release claim.

[ELM11 Feather source campaign](https://www.crowdsupply.com/brisbanesilicon/elm11-feather) · [CycloMod source repository](https://github.com/gsteiert/cyclomod)

## Read link availability precisely

The endpoint audit records HTTP responses separately from model and revision review. A responding URL does not prove the correct datasheet was returned. Restricted access, timeouts and deferred checks remain unverified; they are not called broken links. Saved documents remain available offline when a publisher page disappears.

[Endpoint results and limitations](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/LINK-AUDIT.md) · [Intake and audit report](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.9.md)

[Read the public wiki](https://valleytech-black-wire-guide.pages.dev/wiki/new-hardware-and-source-checks/) · [Open the guide](https://valleytech-black-wire-guide.pages.dev/)
