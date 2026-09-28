# LoRa radios and GPIO devices

Match the radio module, carrier, region and board revision before using a connector reference.

## Start with the exact model

Search RAK11161, RAK3212, HT-N5262M, Mesh Node T096, nRFLR1121, H4M Pro, ESP32-MDK, HALMET, HALPI2 or SH-ESP32. Radio modules, host boards and enclosed nodes are separate records. A firmware target or shared radio chip does not establish a common connector order.



## Module and carrier numbering differ

RAK WisConnector tables use 40 numbered contacts plus F contacts, separate from module castellations. Elecrow module pin maps do not establish carrier header positions. Wio-SX1262-LF is a separate 28-contact module from the similarly named HF add-on. D1 mini Lite uses ESP8285; standard and Pro references are revision-specific ESP8266 boards.



## Keep GPIO gaps visible

H4M Pro has original source schematics and identification photography; a complete physical GPIO map is still needed. The older H4M connector image in the MDK project is not asserted to apply to H4M Pro. Heltec T1 preliminary documentation and missing HT-N5262M datasheet links retain their source notes. Label photos and block diagrams are supporting references, not complete pinouts.



## Study a practical example

Random Nerd Tutorials provides an ESP32/RFM95 LoRa wiring project. Follow the exact hardware, radio band, logic levels and software assignments used by that project; do not treat its wiring as a universal ESP32 map. The original tutorial and illustrations belong to their authors.

[Random Nerd Tutorials: ESP32 with RFM95](https://randomnerdtutorials.com/esp32-lora-rfm95-transceiver-arduino-ide/)

## Coverage and credits

This snapshot adds 34 records, enriches 12 and saves 104 reference attachments, including 25 physical pinout images and 164 sourced pin-function rows. More RAK, Heltec, Seeed, Elecrow and distributor leads remain open; no complete worldwide inventory is claimed. Manufacturer artwork retains its own rights. The editorial edition remains First Edition / 2026.

[Intake and remaining gaps](https://github.com/valleytechsolutions/black-wire-pinouts/blob/main/docs/EXPANSION-2026.09.13.md)

[Read the public wiki](https://valleytech-black-wire-guide.pages.dev/wiki/radio-and-gpio-references/) · [Open the guide](https://valleytech-black-wire-guide.pages.dev/)
