# Install and update Black Wire

Download from the [official releases](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/releases/latest). GitHub's automatic source ZIP is not an installer.

## Windows x64

Run **Black-Wire-0.14.0-windows-x64-setup.exe**. This is the only installer file you need; it creates Start menu and desktop shortcuts. Windows 10/11 x64 is the intended platform; release notes identify the exact native test environments.

**Do not download old library ZIP parts for this installer.** Version 0.14 replaces their extraction step. Search, previews and wiring guides are included. Original diagrams and PDFs download inside the app.

Users of 0.13 or earlier must install this version once to gain the updater. Setup preserves an older installed reference library before replacing the app. This first migration may need another 2.6 GB free while the library is copied. If preservation fails, setup stops before removing the old installation. Saved workbench data is separate.

## Linux x64

**Ubuntu/Debian desktop: prefer the DEB.** Open it with your package manager, or run:

```sh
sudo apt install ./Black-Wire-0.14.0-linux-amd64.deb
```

The package installs dependencies and an application-menu entry. In-app updates use the system package manager and may request administrator authentication through PolicyKit. A desktop PolicyKit authentication agent is required unless the account has passwordless sudo. Do not run the app as root.

**AppImage:** keep it in a writable folder, make it executable, then open it:

```sh
chmod +x Black-Wire-0.14.0-linux-x64.AppImage
./Black-Wire-0.14.0-linux-x64.AppImage
```

AppImage needs FUSE 2 compatibility and a working Chromium sandbox. Prefer the DEB on Ubuntu 24.04, where AppArmor can restrict unregistered AppImages. Do not disable the sandbox or change system security settings to make it run. Other distributions need their own validation.

## Prepare for offline use

Open **Updates & offline library → Download offline library**. The complete collection occupies about 2.6 GB; allow at least 4 GB free for the app, references and update workspace, plus space for the installer download and any legacy migration.

Browse while it downloads. Pause or close the app at any time; completed files remain available and are reused on retry. **Wait for “Ready for offline use” before relying on the complete collection without internet.** Individual originals also download when opened online. Manufacturer website links still require internet.

## Updates inside Black Wire

1. Open **Updates & offline library → Check for updates**.
2. Choose **Download update**.
3. Choose **Restart & update** when ready.

The app also checks after launch and periodically while open. It never installs merely because you close it. Bookmarks, measurements and verified originals live outside the app installation and survive updates. Changed collection snapshots download missing/changed files; unchanged files are reused. Old cached references are retained, so disk usage can grow.

If a download fails, check connectivity, disk space and permissions, then retry. If Linux authentication is cancelled, retry the update. Export a workbench backup from About before moving computers.

## Signing and checksums

This normal release's Windows package is **unsigned**. A normal GitHub release does not establish publisher trust; Windows may still show a reputation warning. No signing certificate has been purchased or configured. Do not disable Defender, SmartScreen or organizational security policies.

Compare the download to SHA256SUMS.txt from the same release:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\Black-Wire-0.14.0-windows-x64-setup.exe'
```

```sh
sha256sum -c SHA256SUMS.txt --ignore-missing
```

Update files have checksum verification; references are verified against the app's pinned SHA-256 index. Checksums do not substitute for publisher signing. macOS source remains available, but **no newly validated macOS installer is included**. Earlier releases remain unchanged.

[Release notes](RELEASE-0.14.0.md) · [Build instructions](BUILDING.md) · [Updater supported targets](https://www.electron.build/v26/docs/features/auto-update/)
