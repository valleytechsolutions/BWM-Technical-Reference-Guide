# Black Wire 0.15.0 — breadboard maker

First Edition / 2026 · Collection **2026.09.13**, unchanged.

Build a circuit beside its device references, define your own devices, test the supported DC components, and take an assembly guide to the workbench.

- Add catalog boards and devices, map their terminals, and wire them to supplies, resistors, LEDs, diodes, capacitors, switches, push buttons, potentiometers, NPN/PNP transistors and active buzzers.
- Choose mini, half or full-size breadboards, split their power rails, and use up to four boards in one circuit.
- Insert parts directly into breadboard holes: two-lead parts in any two holes, and potentiometers, transistors, tactile buttons and packaged devices from pin 1 with a rotatable preview. Drag or nudge inserted parts, including between boards, rotate them, or lift them from the board. Occupied-hole checks catch conflicting placements.
- Use the device maker to give a device ordered terminals, roles, a SIP/DIP/dual-row breadboard package and an optional power profile. Connection checks catch reversed power and VCC–GND shorts; the DC test models the device's current draw and flags supply voltage outside the entered range and overdriven inputs. Save devices to **My devices** and reuse or export them.
- Catalog boards with transcribed connector lists load their terminals in physical order, with a note linking the pinout image they were transcribed from.
- Shape and label wires, reconnect endpoints, rotate or duplicate components, and inspect connected breadboard contacts. Pan, zoom and an expanded workspace help with larger layouts.
- Run the LED, inserted LED and adjustable dimmer examples. The DC test responds to component values, switch state and potentiometer position; probes and a two-lead multimeter show voltage and direct-path continuity.
- Keep separate local projects with undo/redo, portable circuit files and protection against conflicting edits in another tab.
- Use the build guide for a parts list, wiring checks, notes and assembly checklists. Download a self-contained HTML sheet with the layout, inserted lead positions and terminal-to-terminal wiring instructions, ready to print or save as PDF.

Open **Breadboard**, choose **Load inserted LED** or **Load transistor switch**, then **Run DC test** to try a complete circuit. [Workbench instructions](WORKBENCH.md#breadboard-maker).

## Saved circuits

Circuit exports use format version 3 to preserve inserted lead connections, board layouts, new component values and device profiles. Imports accept versions 1, 2 and 3, upgrading older files automatically. Saved devices are stored separately and export as their own library file. The original legacy single-circuit save remains untouched. Circuit backups are separate from the About-page bookmark and measurement backup.

## Validation and limits

Local validation passed the production build, all 113 source tests and all 22 breadboard browser checks. One browser workflow passed on retry after a timeout.

The DC model uses ideal connections and supplies with simplified component behavior; capacitors are treated as fully charged and transistors use a simplified current-gain model. Catalog devices remain wiring references unless you enter a power profile, which models only their current draw and your voltage limits: firmware, GPIO behavior, sensors and communication protocols are not simulated. Transcribed connector lists are not electrical verification. Component artwork is illustrative and does not validate physical footprints or establish that a real build is safe.

Version 0.15.0 is prepared in source. Native installer/update validation, desktop assets and release publication are pending. The existing download links remain on 0.14.0 until matching tested packages are published. Follow the [native release gate](BUILDING.md#native-release-gate) before distributing installers.

Previous releases remain unchanged. This is a software update, not a new book edition; the collection snapshot, manufacturer artwork and book draft are unchanged.
