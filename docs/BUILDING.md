# Build and validate Black Wire

Use Node.js 24 and pnpm 11.19.0. Clone the app and collection as siblings. Release builds must use the collection commit in data/library-source.json.

```sh
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm library:import
pnpm test
pnpm build
pnpm desktop:prepare
pnpm start
```

BLACKWIRE_LIBRARY_ROOT can select the pinned collection's library directory. Import verifies original hashes. desktop:prepare creates a SHA-256/size index and bundles browsing assets. Originals are served from the persistent cache, an existing local library, or a verified download. The fallback source is an exact pinned Git commit.

## Native packages

Run pnpm dist:win, pnpm dist:linux or pnpm dist:mac on the corresponding OS. Windows produces one NSIS installer, without external ZIP parts. Linux produces an x64 DEB package. macOS targets require separate signing, notarization and native validation. Use a short Windows checkout path to avoid NSIS/pnpm include-path limits.

The Windows customInit hook preserves a legacy resources/library before the old uninstaller runs. Current references live outside the installation directory. DEB updates call the package manager with argument arrays and normal repository signature checks.

electron-updater is a locked production dependency. Packaged app-update.yml selects this project's GitHub feed. Renderer IPC cannot supply update URLs, paths or arbitrary commands. Do not disable signature checks or enable development feeds in published builds.

## Native release gate

Run **Validate desktop installers and updates** (preview-builds.yml) on the candidate branch. It installs real packages on disposable native runners, tests a lower QA-only build upgrading to the candidate, and retains tested release artifacts. Never upload the lower QA package to Releases.

tests/installer-update.mjs refuses to run outside CI because it installs packages. Tests cover fresh install, native launch, image/PDF checksums, failed checks, real updater download/install/relaunch, saved data, cache reuse and Windows legacy migration. Source tests cover corruption, truncation, pinned fallback, restart reuse and updater state transitions. Browser regression is separate.

Publish the exact successful artifacts, not a later rebuild. Attach the Windows installer and blockmap, Linux DEB, latest.yml, latest-linux.yml and SHA256SUMS.txt. The DEB must appear in Linux update metadata. Verify uploaded hashes before publishing the draft as a normal release. Future releases need the metadata files or installed clients cannot update. Keep older releases immutable.

## Signing and other destinations

Default Windows builds are unsigned; disclose this. The requested normal-release designation does not imply signing. electron-builder.signed.cjs requires CSC_LINK and CSC_KEY_PASSWORD; macOS additionally requires the Apple variables named there. Do not commit certificates, tokens, secrets or workbench backups. Real-certificate signing is not yet validated.

pnpm build:web generates the browser app and wiki, without desktop updater/cache files. Publish only web-release through the existing workflow. pnpm wiki:docs generates GitHub wiki material. See [maintenance](MAINTENANCE.md) and [website integration](WEBSITE.md).

The older package-library.py and ZIP NSIS scripts remain for historical/collection regression; they are not in the current Windows installer path. Never regenerate older published releases.

AppImage is excluded from 0.14.0 because automatic restart did not pass native validation. Its experimental updater has been removed from the release code. Do not publish an AppImage without a separate successful native update test.
