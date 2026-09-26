# Use the Power Desk carefully

Read supply requirements, compare adapter labels and estimate battery runtime without confusing a calculation with a hardware test.

## Start with exact hardware

1. Match the board revision and the input connector. USB, VIN, VSYS, battery contacts and GPIO can have different limits.
2. Open the voltage-chart row to read its notes and manufacturer sources. A nominal voltage alone is not an allowed voltage range.
3. Distinguish recommended adapter capacity from observed current. Published operating examples retain their workload and source; they are not measurements made by Black Wire.



## Compare an adapter

Read the OUTPUT label, select A or mA, and enter the exact input operating range and complete load requirement. 1 A equals 1,000 mA. Check DC regulation, polarity, connector, negotiated USB-PD mode and simultaneous power connections. Known profile bounds are locked. Changing a rating clears confirmations. Entered ratings align means only that the submitted comparison passes; it does not certify the hardware.

[Arduino UNO Rev3 power inputs](https://store.arduino.cc/products/arduino-uno-rev3) · [PJRC external power and USB isolation](https://www.pjrc.com/teensy/external_power.html)

## Estimate battery runtime

Supply chemistry-specific cell ratings, series and parallel counts, load power, conversion efficiency and usable nominal energy. Runtime is nominal Wh multiplied by efficiency and usable-energy fraction, divided by load watts. An optional minimum cell voltage estimates the higher input current at low pack voltage. This constant-load estimate excludes unmodeled peaks and cell imbalance. It does not establish charging, protection, thermal or discharge suitability.

[Adafruit battery protection guidance](https://learn.adafruit.com/li-ion-and-lipoly-batteries/protection-circuitry)

## Budget a multi-board project

Enter each final load once at its rail voltage. The tool adds watts, accounts for each conversion path and applies your planning margin. Use the lowest upstream voltage for a conservative constant-power current estimate. Include quiescent loads and peaks. Do not count a regulator output and its downstream loads twice. Check each rail, regulator, wire and connector separately.



## Keep uncertainty visible

Blank ratings remain unknown. Invalid inputs and arithmetic overflow prevent a result. Thirteen profiles and 22 published observations were reviewed against manufacturer documentation in September 2026; this covers a small part of the catalog. None of these records is an independent Black Wire electrical certification.



[Read the public wiki](https://valleytech-black-wire-guide.pages.dev/wiki/power-desk/) · [Open the guide](https://valleytech-black-wire-guide.pages.dev/)
