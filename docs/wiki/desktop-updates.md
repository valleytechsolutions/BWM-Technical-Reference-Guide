# Install and update the desktop app

One installer, a persistent offline library and updates inside Black Wire.

## Install once

Download the Windows setup EXE or Linux DEB from the official release. Version 0.14 and later no longer require library ZIP parts beside the Windows installer. Users of 0.13 and earlier need the new installer once to gain the updater.

[Official downloads](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/releases/latest)

## Prepare for offline work

Search, previews and wiring guides are included. Original reference files download when opened. Choose Updates & offline library, then Download offline library to save the whole collection before going offline. Wait for Ready for offline use. Downloads are verified against the bundled hashes, and completed files are reused if you pause, restart or update.



## Update without starting over

1. Open Updates & offline library and choose Check for updates.
2. Choose Download update when a newer release is available.
3. Choose Restart & update when ready. Bookmarks, measurements and downloaded references remain on this computer. Linux DEB updates may request administrator authentication.



## Requirements and release status

Missing references and app updates require internet access and free disk space. The Linux release uses a DEB package for Ubuntu/Debian desktop integration and runtime dependencies. AppImage is not included because its restart check did not pass. The Windows package is currently unsigned; a normal GitHub release is not a code-signing certificate. macOS source remains available, but this release does not add a verified macOS installer.

[Platform details and troubleshooting](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/blob/main/docs/DOWNLOADS.md)

[Read the public wiki](https://valleytech-black-wire-guide.pages.dev/wiki/desktop-updates/) · [Open the guide](https://valleytech-black-wire-guide.pages.dev/)
