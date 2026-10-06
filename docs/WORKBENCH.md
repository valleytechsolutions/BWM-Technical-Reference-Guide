# Black Wire Technical Reference Guide

Workshop preview 0.1.1 • September 2026 • Made by Kal

An offline desktop workbench for finding board pinouts, keeping references close, and checking power data. The Black Wire arrow is the primary identity; Valleytech appears in the sidebar, footer and About. **—your pal kal** · [@valleytechsolutions](https://www.youtube.com/@valleytechsolutions)

## Open the application

**Windows:** double-click the **Black Wire Technical Reference Guide** shortcut on your Windows desktop. You can also open `release/win-unpacked/Black Wire Technical Reference Guide.exe` from **File Explorer**. Open it locally, rather than following an EXE link in a web browser; the browser may show an Internet-security warning. Keep the complete `win-unpacked` folder together, including its `resources` directory. No Node.js installation or internet connection is needed to use the packaged app.

**Linux:** when a matching Linux archive is available in Releases, extract it, then run `black-wire-technical-reference-guide` from the extracted folder. These are desktop Linux builds, not Raspberry Pi OS Lite or 32-bit ARM builds. They require the normal Electron desktop runtime dependencies. Native Linux launch testing remains outstanding.

**macOS:** the application has a Mac target and platform-neutral interface, storage and file handling. A Mac is required to produce and test its `.app`, ZIP and DMG. No Mac binary has been verified or supplied from this Windows machine. Build instructions are below.

Windows is a locally tested, unsigned workshop build. Release signing and macOS notarization are not configured.

## What is included

- 2,988 searchable reference entries across 1,682 populated catalog records and 59 brands/source groups.
- All 1,358 reviewed physical pinout images from the curated collection, plus original PDFs and additional manufacturer source references.
- Search by board, processor variant, manufacturer, filename and alias; filters by manufacturer, processor, family, reference type and review status.
- Quick access for ESP32-C5, ESP32-S3, RP2040, RP2350 and CYD displays.
- Images with zoom, pan and rotation; a local PDF viewer with page navigation; original-file exports and source/revision details.
- Saved boards, local measurement records, and JSON backup import/export.
- A power desk with 13 sourced profiles and 22 published operating observations, plus adapter comparison, battery math and multi-rail power budgets.

Press **Ctrl+K** (Command+K on Mac) or **/** to focus search. Select a board to open its reference sheets. Use **Reference type → Pinout** when you want only physical pinout diagrams. “Unreviewed source” files include dimensions, hardware overviews and other original manufacturer material. Chip-package diagrams remain separately labeled.

The library is a snapshot. New files added by other collection work appear after rebuilding the catalog and application. Existing source folders are not renamed or edited by the application.

## Power data

The chart distinguishes recommended adapter capacity, allowed input voltage, nominal voltage, published operating observations and your own measurements. **None of the published observations were measured by Black Wire.** Input connector, board revision, conditions, source and limitations travel with each profile. Unknown ratings remain blank.

Profiles cover Raspberry Pi Pico/Pico 2, Pi 5/4B/3B+/Zero 2 W, Arduino UNO R3, Teensy 2.0/++2.0/4.0/4.1, Espressif ESP32-C5-DevKitC-1 revision 1.2, and Heltec Wireless Paper. Published observations include the Pico datasheet workload, PJRC power measurements, Raspberry Pi typical figures and Heltec operating-current tables. Not every profile has a measured result.

An adapter comparison is a check of entered ratings, not electrical validation. A typical idle reading is not a worst-case supply requirement. Battery math estimates voltage, capacity and runtime; it does not choose protection or charging hardware.

Source URLs and sections are recorded in `data/power-profiles.json` and displayed in the app. The saved Heltec PDF is included locally. Opening an external source website requires a connection; reading the stored facts and bundled references does not.

## Breadboard maker

Open **Breadboard maker** from the sidebar. **Load LED example** provides a connected 5 V supply, 330 Ω resistor, LED and switch; **Run DC test** lights the LED and displays approximately 8.57 mA. Toggle the switch to open or close the circuit while the test runs.

- Add simulated parts from **Components**, or search **Your catalog** for existing boards and modules. Reference dialogs also offer **Add to breadboard**.
- Click a terminal or breadboard hole, then a second terminal or hole to create a wire. Escape cancels a pending connection. Select a wire to recolor or remove it.
- Select a part and choose **Insert into breadboard**. Two-lead parts (resistor, LED, diode, capacitor, switch, buzzer) take any two holes: the first hole is lead 1 (LED anode +), the second lead 2. Potentiometers and transistors insert three leads in a row, push buttons straddle the center gap with their paired legs across it, and devices follow the package chosen in the device maker. For these, hover a hole to preview every lead, press **R** or **Rotate preview** to turn it, and click to place pin 1. Leads connect directly to the strips in the DC model. Insertion rejects occupied holes and leads off the board; putting two leads on one strip is allowed and reported in the build guide.
- Inserted parts can be dragged or moved with arrow keys in steps of one hole, including onto another breadboard. Every lead must remain on a board, and movement into occupied holes is rejected. The leads can span the center gap. For two-lead parts, **Move leads** (or R) chooses both holes again; multi-lead parts rotate a quarter turn around pin 1. **Lift from breadboard** removes the direct strip contacts while retaining any explicit wires. Copies start uninserted. All of these edits support undo/redo.
- Copper outlines show holes occupied by jumper ends or inserted leads; hovering highlights the connected strip and component contacts. Drawn component shapes are illustrative and do not validate physical lead spacing or package fit. Supplies, and devices without a package, use explicit wires.
- Breadboard A–E holes share each numbered column; F–J share each column separately across the center gap. Top and bottom rails are separate until wired together.
- Click a breadboard body, or choose **Boards**, to change it: **Mini** (17 columns, no power rails), **Half** (30 columns, the default) or **Full** (63 columns). **Power rails split at the middle** separates the left and right halves of every rail, as on many full-size boards. **Add breadboard** places up to four boards per circuit; drag a board body to move it. Holes on the first board keep their names (A14, TP2); other boards are named “Breadboard 2 A14” and appear as BB2 in the build sheet. A board cannot shrink while connections use the removed columns, and removing a board lifts its inserted parts and removes its wires (undo restores them).
- Drag a part's header to move it. A focused header also accepts arrow keys. Placement is visual; connect terminals explicitly with wires.
- Select a part to rename it or edit its values. Press Enter or leave a numeric field to apply a valid value. Electrical edits stop the test until you run it again; switches and push buttons update a running test immediately. Hold a push button's cap to press it; it releases when you let go and is never saved pressed.
- Select **Probe**, then a hole or terminal, to read its voltage during a test. Each independent powered circuit uses its first supply's negative terminal as the voltage reference. Unsolved or disconnected nodes stay unknown.
- Undo/redo covers edits in the current project session. Switching projects resets that session’s history. New, example loading and import create separate projects; return to an earlier build using **Projects**. Removing a component removes its attached wires too.
- Rotate components in 90° steps with **Rotate** or **R**. **Duplicate** or **Ctrl/Command+D** makes an independent copy without attached wires.
- Double-click a wire or choose **Add wire bend**, then drag its handles or nudge them with arrow keys. Select **Reconnect from/to**, then a terminal or hole, to move a connection without deleting its route. Wire labels, bends and rotations survive export/import.
- In **Your catalog**, **With pins** lists boards and modules that arrive with their terminals; **Without pins** lists those you set up yourself in the device maker. Transcribed boards load their terminals in physical order (for example `J1 · 3 · GPIO4`) with a note linking the manufacturer pinout image and any warnings, such as a pin 1 end that could not be confirmed. Check the terminals against the image and your board revision before wiring. The note follows the device into saved devices, exports and the build sheet.
- For catalog devices, enable **Show original reference artwork**. Edit a terminal, choose **Place terminal on device**, then click its contact on the reference. Percentage coordinates also support keyboard placement. These are manually authored project notes, not verified physical pin assignments. Deleting a terminal removes its attached wires and can be undone.
- Use **Pan**, zoom, or **Expand workspace** for larger builds. **Connections** lists the wiring; **Parts list** lists components and their entered values. Crossed wires are not electrical junctions unless connected through a terminal or breadboard strip.
- **Multimeter** measures red minus black during a DC test. Choose the red or black lead and click a terminal or hole; the next click places the other lead. The reading stays visible above the canvas. Swap the leads to check polarity. Independent floating circuits do not have a shared reference and show an unknown measurement instead of a voltage difference.
- **Continuity** requires the DC test to be stopped and checks direct paths through wires, breadboard strips and closed switches. It does not measure resistance or treat resistors, LEDs or device internals as direct connections.
- **Build guide** lists each breadboard (BB1…), groups identical components and assigns references (PS1, R1, C1, D1, SW1, RV1, Q1, BZ1, U1) in project order. The same references appear on the canvas and downloaded diagram. Connection checks flag multiple wire ends occupying one physical hole, unconnected modeled terminals, wires bypassing a resistor, LED, diode or buzzer or shorting a supply, transistor leads sharing a strip, and push buttons whose sides are already joined. For devices, they use the roles you assigned: power and ground terminals joined together, ground wired to a supply's +, power wired to a supply's −, unconnected power/ground terminals and wired “not connected” terminals. Select a check or wiring step to locate it on the canvas. These checks do not validate catalog-device electrical compatibility.
- Mark wiring steps installed and add **Build notes** to track physical assembly. This progress is saved and included in JSON export/import; changing a wire's endpoint or color clears its checkmark. Undo restores it. Checkmarks are manual progress, not electrical verification. Build with power disconnected.
- Inserted parts also appear in the build guide and downloaded sheet with each lead’s hole and polarity. Mark them inserted to track assembly. Moving leads clears that part’s insertion checkmark and checkmarks for wires attached directly to it. Imported overlaps remain visible and are flagged by the connection checks; imports never silently relocate leads.
- **Download build sheet** creates an offline HTML file containing a vector layout, parts list, connection checks, notes, and exact wire endpoints. Open the file and use **Print / Save as PDF**. Its diagram uses labeled component outlines rather than external reference artwork. Long layouts can be read by zooming the HTML diagram; the wiring table records full terminal labels and connector references.

DC tests model ideal supplies (0.1–48 V), resistors (1 Ω–10 MΩ), switches and simplified LEDs (0.5–5 V forward knee, 20 Ω on resistance with a smooth transition). Diodes use the same smooth knee (0.1–2 V) with 1 Ω on resistance. Capacitors (1 pF–100,000 µF) are treated as fully charged: they pass no DC current and hold the voltage across them; the test checks their voltage rating and, when polarized, reverse bias. NPN and PNP transistors (hFE 10–1,000, leads E, B, C) use a simplified current-gain model with a smooth transition into saturation; the build guide flags leads sharing a strip and the test flags more than 10 mA of base current, 200 mA of collector current or 0.625 W. Active buzzers are polarized loads drawing their rated current at their rated voltage and show as sounding above 40% of it. Diagnostic example ratings are 20 mA per LED, 1 A per diode and ¼ W per resistor. Tests report shorts and conflicting/redundant ideal sources without fabricating readings. Wires and switches have ideal zero resistance; thermal behavior, AC, timing, reverse breakdown and physical breadboard parasitics are not modeled.

**Catalog devices are wiring plans only.** Recorded terminal labels are logical lists, not spatial pinouts, unless a package places them on the breadboard. If labels are absent, add them from the exact device reference. Firmware, MCU GPIO behavior, displays, sensors and buses are not simulated. A solved DC model does not verify hardware compatibility.

### Device maker

Select a custom or catalog device and open the **Device maker** tab (or **Open in device maker** in the inspector). **Custom device** opens it for a new device.

- **Terminals:** paste labels in pin order, one per line or comma-separated, and choose **Add terminals**. Rename, reorder or remove terminals in the table. Reordering and removal are locked while the device is inserted; lift it first.
- **Roles:** assign each terminal a role: power in, ground, GPIO, input, output, analog, bus or not connected. **Suggest roles from labels** fills only unassigned roles from common names such as GND, VCC, SDA or GPIO4; check each against the exact reference. Roles drive the connection checks above.
- **Breadboard package:** **Single row header (SIP)** places every terminal in one row. **Dual row** splits them into two rows across the center gap: E/F for 0.3 in DIP chips, up to B/I or A/J for wide modules. **Around the chip (DIP)** numbering runs along the lower row and back along the upper row; **Row by row** suits module headers listed left then right. The preview numbers each lead; insertion places pin 1.
- **Power profile:** choose the supply and ground terminals, the minimum, maximum and nominal voltage, and the current draw. The DC test then draws that current as a resistor at the nominal voltage, flags supply voltage outside your range or an unpowered device, and warns when an input, GPIO, analog or bus terminal is more than 0.3 V above the maximum or below ground. These are the values you enter, not datasheet lookups.
- **My devices:** **Save to My devices** keeps the device's name, revision, terminals, roles, package, power profile and any transcription note, but not its position or wiring. Saving again updates the same saved device. Find saved devices at the top of **Your catalog**, add them to any circuit, delete them, or export/import the library as JSON (up to 100 devices, stored under `blackwire-device-library-v1`).

**Projects** stores up to 50 independent circuits in browser/app storage under `blackwire-circuit-projects-v1`. Create a new circuit, reopen another, save a copy, or explicitly confirm deletion of a project. This storage is separate from bookmark/measurement backups. The former `blackwire-breadboard-v1` circuit migrates automatically when no project collection exists; its original data is retained.

Use **Export** to keep the current circuit as version 3 JSON; **Import** accepts versions 1, 2 and 3 and adds a separate project after validating its values, identities, geometry, wire endpoints and inserted lead positions. Version 3 is required for inserted parts so older app versions cannot silently drop those electrical connections. Older projects upgrade without changing their wiring. Invalid files leave all current circuits unchanged. Unreadable saved data pauses autosaving. If another tab changes the collection, autosaving pauses in this tab: export its circuit before reloading the latest saved projects. Limits per circuit are 60 parts, 400 wires, 24 bends per wire, 80 terminals per custom/catalog device, and 2 MB per import.

**Transistor switch example:** a push button straddles the gap at E4/F4–E6/F6. Holding it feeds 5 V through a 1 kΩ base resistor into an NPN transistor at C10–C12 (E, B, C), which saturates and sinks about 8 mA through a 330 Ω resistor and LED. Release it and the LED turns off.

**Inserted LED example:** a 5 V supply powers a 330 Ω resistor inserted at C8/C14 and an LED at E14/F14. Four jumpers connect the supply, positive feed and return. The resistor and LED share column 14 on the upper strip; the LED’s cathode crosses the center gap to the lower strip. Run the DC test for approximately 8.57 mA, then use the multimeter or move a lead to explore the connections.

**Dimmer example:** a 10 kΩ potentiometer across 5 V feeds a 330 Ω resistor and LED through its wiper. Run the test and move **Wiper position** from 0% (B) to 100% (A). The simulator solves both track segments and the LED load together, with a minimum 1 mΩ contact resistance. At 0% the LED is off; at 100% it draws about 8.57 mA. Intermediate brightness is nonlinear because the LED loads the divider. The generic potentiometer supports 100 Ω–1 MΩ, and the visual LED brightness scales with calculated current up to 10 mA. This is an analog circuit model, not firmware emulation.

## Your records

Bookmarks and measurements are saved in Electron's user-data folder under **Black Wire Technical Reference Guide**:

- Windows: `%APPDATA%/Black Wire Technical Reference Guide/workbench.json`
- Linux: `$XDG_CONFIG_HOME/Black Wire Technical Reference Guide/workbench.json`, normally `~/.config/...`
- macOS: `~/Library/Application Support/Black Wire Technical Reference Guide/workbench.json`

Use **About the guide → Export backup** to move your personal records between systems. Import merges records. A personal backup does not contain the image library. Browser development previews use their own local browser storage.

## Build and update

Follow [BUILDING.md](BUILDING.md) first to import the collection from its separate repository. Use Node.js 24 LTS and pnpm 11.19.0. Run these commands in the `Black Wire App` folder:

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm build
pnpm start
```

To regenerate the library from the full guide's parent folder:

```sh
pnpm catalog
pnpm build
node scripts/verify-library.mjs
```

`BLACKWIRE_SOURCE_ROOT` may point to another full guide folder. The existing source collections and `_Catalog/ASSETS.json` and `BOARDS.json` must be present there. The standalone source bundle already contains a built `library` and `public/catalog.json`; it can be built without reindexing the original collection.

Native packaging:

```sh
# Windows
pnpm dist:win
# Linux (run on Linux)
pnpm dist:linux
# macOS (run on a Mac; both Intel and Apple Silicon)
pnpm dist:mac
```

For local Windows packaging with the installed runtime, the verified command is:

```sh
node node_modules/electron-builder/cli.js --win dir --x64 --config.electronDist=node_modules/electron/dist
```

The Linux tar archives can also be prepared from Windows using `electron-builder --linux tar.gz --x64 --arm64`. Creating macOS packages requires macOS. Signing credentials must be configured before a signed public release. The repository-specific setup is in [BUILDING.md](BUILDING.md).

Useful checks:

```sh
pnpm test
pnpm exec playwright install chromium
pnpm test:ui
node scripts/verify-library.mjs
# Native Windows application, isolated test data:
node tests/electron-smoke.mjs --packaged
```

## Project layout and known limits

`src` contains the interface and power calculations; `electron` contains the sandboxed desktop shell; `scripts` builds and verifies the catalog; `data` contains power sources and collection reports; `library` contains hash-addressed originals and previews; `release` contains packaged apps. Original logos are retained under `public/brand`. Runtime dependency notices are bundled as `THIRD_PARTY_NOTICES.txt`.

The catalog indexes all 2,187 supported media/document files in the original manufacturer and supplemental source collections, including identical-file aliases. Raw research caches and rejected candidates are not presented as reviewed references. Catalog record counts include source product records and shared references, not a census of distinct development boards.

One existing Seeed **reSpeaker Lite Hardware Overview Front** PNG is truncated, including a fresh copy from its original URL. Its original bytes and source record are retained; the app reports that it cannot preview that source. It is not one of the 1,358 reviewed physical pinout images. See `data/catalog-build-report.json` for the exact file/hash.

Some diagrams are partial or low resolution; original revision/coverage notes are retained. Board identity and pin assignments have not been independently electrically verified. Manufacturer/source artwork keeps its original credit and rights records. No claim is made that every board ever manufactured is covered.

Windows desktop testing covers local catalog loading, image decoding, PDF rendering, original export hashes, saved-board persistence, renderer isolation and path restrictions. Browser tests cover search, filters, zoom, bookmarks, power tools, measurements, backup export and the narrow layout. Linux and macOS native launch validation remains a release task.
