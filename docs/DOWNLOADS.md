# Downloads, integrity and security warnings

Use the assets attached to a tagged [GitHub release](https://github.com/valleytechsolutions/black-wire-desktop/releases), not the automatic source ZIP as an installer. Match your OS and CPU architecture. Release notes must state the tested platforms and whether each artifact is signed.

## Current workbench preview / 0.9.0

Windows x64 installer, **unsigned**, with collection snapshot 2026.09.9 and 501 maker intake records. Library integrity and browser checks passed. Native launch and clean-machine installation of this build, code signing and new Linux/macOS binaries are not claimed for this preview.

## Windows

Download the setup EXE and **Black-Wire-Library-2026.09.9.zip** from the same release into the same folder. Keep the ZIP unextracted. Run the setup EXE; it checks the library SHA-256 before replacing an existing app, then extracts the library locally. Setup creates per-user Start menu/desktop shortcuts. Missing or changed archives stop installation with a clear error. Allow approximately 6 GB of free space for the downloads, installed files and temporary installer data. The library ZIP is content, not a portable app. Launch from File Explorer or the installed shortcut; a browser's local directory page is not an application launcher.

Workshop previews are unsigned. Packaging and HTTPS downloads cannot guarantee that Windows will trust a new executable. For public distribution, use a trusted Authenticode certificate/cloud signing service and a consistent publisher identity, timestamp signatures, and verify both the installer and application. New signed builds can still receive SmartScreen reputation warnings. A Microsoft Store distribution is another route to evaluate; it is not configured here.

Do not disable Defender, SmartScreen, Internet security zones or organizational policies to install this guide. If Windows blocks a download, record the exact dialog and verify its origin, signature and checksum before deciding what to do. The prior local browser/Explorer warning has not been conclusively diagnosed.

## macOS and Linux

macOS distribution requires Developer ID signing and Apple notarization. A local unsigned build is not equivalent to a signed/notarized release. Linux packages need correct executable permissions, desktop runtime dependencies and native testing on supported distributions.

## Verify the download

Compare the downloaded file's SHA-256 to the `SHA256SUMS.txt` attached to the **same release**:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\Black-Wire-0.9.0-windows-x64-setup.exe'
```

```sh
sha256sum -c SHA256SUMS.txt
# macOS: shasum -a 256 <downloaded-file>
```

Checksums detect changed bytes; they do not establish publisher identity. Never mark an unsigned file as signed based on a matching hash.

## Maintainer release checklist

1. Pin the collection commit and run library integrity checks, unit tests, browser tests and native desktop checks.
2. Build on native hosts. Use the signed configuration for public signed Windows/macOS releases.
3. Verify signatures and notarization; test downloaded installers/archives on clean systems.
4. Generate SHA-256 checksums from the final distributable bytes, after signing.
5. Attach binaries and checksums to a tagged release with truthful platform/signing status. Keep each GitHub release asset below 2 GiB; split future library bundles if needed.

Sources checked September 2026: [Microsoft SmartScreen reputation for developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation), [Electron code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing), [Apple notarization](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution), [GitHub release limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).
