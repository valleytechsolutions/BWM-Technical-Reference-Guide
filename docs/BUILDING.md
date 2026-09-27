# Build and development

Use Node.js 24 and pnpm 11.19.0. Windows packaging also requires Python 3 (standard library only), available as `python`. Clone the two repositories as siblings:

```sh
git clone https://github.com/valleytechsolutions/black-wire-desktop.git
git clone https://github.com/valleytechsolutions/black-wire-pinouts.git
cd black-wire-desktop
pnpm install --frozen-lockfile
node node_modules/electron/install.js
pnpm library:import
pnpm build
pnpm start
```

The importer checks each original reference against the catalog SHA-256 before copying it. `BLACKWIRE_LIBRARY_ROOT` can point to a different collection's `library` directory. Building and using the finished application does not fetch board references from the internet. The snapshot commit used by release builds is recorded in `data/library-source.json`.

```sh
pnpm test
pnpm exec playwright install chromium
pnpm test:ui
pnpm build:web
pnpm test:makers
node scripts/verify-library.mjs
```

For renderer development, `pnpm dev` runs Vite on localhost. Browser workbench storage is separate from desktop storage.

## Native preview packages

Run on the matching OS. Windows supports the NSIS installer, Linux AppImage/tar.gz, and macOS DMG/ZIP for Intel and Apple Silicon.

```sh
pnpm dist:win
pnpm dist:linux
pnpm dist:mac
```

The default Windows/Mac configuration is explicitly an **unsigned workshop preview**. Linux/macOS native validation is still required; source compatibility is not proof of platform testing. The CI workflow builds unsigned preview artifacts for native validation, not automatic public stable releases.

Windows builds create a small installer and `release/<version>/Black-Wire-Library-<snapshot>-part-XX.zip`. Distribute the installer and every ZIP part together, with SHA256SUMS.txt. The generated `build/library-package.nsh` binds the installer to every exact archive hash; regenerate and rebuild the installer whenever the library changes. The archive contains only manifest-listed library files. For testing the unpacked Windows app, copy `library` to its `resources/library` directory after packaging; the distributed installer performs this extraction itself.

On Windows, `node tests/electron-smoke.mjs --packaged` checks the packaged app using isolated test data. Set `BLACKWIRE_PACKAGED_DIR` for an output directory other than `release/win-unpacked`.

## Signed distribution

The separate `electron-builder.signed.cjs` configuration enables required signing and fails if signing credentials are absent. Supply `CSC_LINK` and `CSC_KEY_PASSWORD` securely through the local environment or CI secrets. The Windows publisher identity must match the certificate.

```sh
pnpm dist:signed:win
pnpm dist:signed:mac
```

Mac builds also require `APPLE_API_KEY`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`, an appropriate Developer ID certificate and notarization access. Never commit a PFX/P12, API key, certificate password, token or personal workbench backup. Signed configuration is prepared but has not been validated with real certificates.

Verify Authenticode signatures on the Windows app and installer; on macOS verify codesign, notarization and stapling, then test a downloaded build on clean systems. See DOWNLOADS.md. Do not publish a stable release until native launch and signing/notarization checks pass.

The older `catalog` and `create-power-data` scripts support the original collection workspace layout. For these separated repositories, use `library:import`; the full original research workspace is not required.

## Browser / Shopify edition

Use `pnpm build:web` and `pnpm test:web` for the browser edition. [Website integration](WEBSITE.md) explains static hosting and embedding the guide in the Valleytech store. The browser build is independent of the native Windows installer.

On Windows, use a short checkout path (for example, `C:\src\black-wire-desktop`). NSIS can reject long template include paths inside pnpm's dependency store even when Node can read those files.


Maker catalog maintenance: edit the collection repository's `catalog/maker-parts.json`, run `python tools/build-maker-index.py` and then `python tools/rebuild-indexes.py`. Pin the resulting collection commit before importing. Manufacturer documentation records are not complete physical pinout approvals.

On Windows, NSIS may reject long pnpm template paths. Use a short checkout path for release builds; this is a build-path constraint, not a reason to change OS security settings.

Run `node scripts/audit-search.mjs` after importing a catalog to check every listing name and separator variant. `node scripts/benchmark-search.mjs` measures search-function timing. Set `BLACKWIRE_PREVIEW_PORT` to use a separate local browser-storage origin for QA.

Multipart packaging regression tests: `python tests/test_offline_packages.py`. Each archive is independently extractable; no concatenation is required. Every member is included once. Native preflight must reject a missing or changed later part before changing an existing install.
