# Black Wire on the Valleytech web store

The guide can be a normal navigation destination within the existing Shopify store. Visitors use the browser version without installing the Windows application.

The [automatic publishing workflow](AUTOMATIC-DEPLOYMENT.md) can update the live guide whenever a change is merged into `main`. Pull requests run checks without changing the website.

Live store page: [BWM-Technical Reference Guide](https://valleytechsolutions.tech/pages/bwm-technical-reference-guide)

Full-screen guide: [valleytech-black-wire-guide.pages.dev](https://valleytech-black-wire-guide.pages.dev/)

Menu label: **BWM-Technical Reference Guide**

The guide was initially published on September 25, 2026. The guide is linked from the store navigation and footer. Cloudflare Pages hosts the browser application and reference files.

## Black Wire brand theme / 0.11.0

The web app, desktop app, static wiki, 404 page and share card use one brand theme: near-black surfaces, Black Wire signal red for the current location, primary actions and status markers, and a light royal gold for labels, links and keyboard focus. A red wire runs along the top edge of every page and under each page title, a faint Black Wire mark sits behind page titles, and each title carries a **BWM Reference / section** label. Reference images and PDFs keep their original colors on a light plate. Light mode keeps the same structure.

Page headers lead with a plain title, one factual sentence and the collection figures, replacing the earlier slogans and circuit artwork. The share card and page description drop "Know your board. Make the connection." in favor of "Board pinouts, manufacturer source files and power data. Every reference keeps its source, revision and review status."

The app theme is `src/brand.css`, loaded after the base stylesheets; the wiki theme is `public/wiki.css`. `node scripts/build-social-card.mjs` regenerates `brand/social-card.png`. The browser theme color and Electron window background are `#0a0808`. After `pnpm build:web`, `pnpm screenshots` recaptures `docs/screenshots` from the browser edition.

## Search and source audit / 0.9.0

Collection **2026.09.9** has 2,593 board/device listings and 501 maker listings. The update includes source availability, corrected chip classifications and search behavior, and new ESP-Mosaico/P4X/FPGA references. [Evidence and limitations](RELEASE-0.9.0.md). The generated web build has 39 wiki/directory pages and 7,823 files; references still load on demand.

## Previous Jetson, NanoPi and I/O update / 0.8.0

Collection **2026.09.8** includes 2,589 board/device listings and 501 maker listings, with 3,354 board references and 1,511 physical pinout-image entries. Every listing exposes documentation coverage; missing board datasheets remain visible. Original model websites, hardware guides and schematics are distinct. I/O & expansion browsing and punctuation-aware model search support the new intake.

The generated site has 38 wiki/directory pages and 7,781 files / approximately 2.37 GB. References load on demand. Its largest file remains 15.86 MB, within the checked direct-upload limits.

## Previous manufacturer, SBC and Power Desk update / 0.7.0

Collection **2026.09.7** includes 2,514 board/device listings and 501 maker listings, with 3,240 board references and 1,496 physical pinout-image entries. SBC architecture filters and direct hardware links support the expanded collection. The Power Desk displays reviewed input notes and source citations, resets adapter confirmations after rating changes, and includes battery derating and low-voltage current estimates. These are documented comparisons, not independent electrical certifications.

The generated site has 36 wiki/directory pages and 7,560 files / approximately 2.29 GB. Its largest file is 15.86 MB. The Power Desk and SBC guides are also published in the GitHub wiki. Build reports and browser checks remain local.

## Reliability update / 0.6.1

PDF scrolling, rotation, bounded zoom, page navigation and retry now share the same web/desktop implementation. Collection snapshot **2026.09.6** adds eight references across five board models.

## Theme and discovery update / 0.6.0

The web and desktop apps share a default charcoal-and-gold dark theme (since replaced by the brand theme above) and a persistent Light mode. The current title is **The Black Wire Maker's Technical Reference Guide**. Collection snapshot **2026.09.5** is unchanged; this is an interface and documentation release.

The public [reference wiki](https://valleytech-black-wire-guide.pages.dev/wiki/) includes eight guides plus board-family and maker-category directories. All 32 wiki/directory pages are static HTML. The root app has crawlable fallback content, and the site includes canonical metadata, a social card, structured data, robots.txt and a 33-URL sitemap. See [discovery maintenance](DISCOVERABILITY.md).

## How it fits into the store

The Shopify page keeps the store's header, navigation and footer and embeds the browser guide in an iframe. An **Open the guide full screen** link provides more room on small displays and an alternative when a browser restricts embedded storage or downloads. A link in the main store menu points to this page. Products, cart and checkout continue through Shopify.

The app and reference files are deployed to a separate static web host. A host-provided HTTPS address is sufficient; an optional `guide.valleytechsolutions.tech` subdomain can be connected later. No change to the storefront's primary domain or nameservers is needed merely to add the embedded page.

The entire reference catalog is included. Images and documents load when requested; opening the guide does not download the entire collection. No server-side customer database, Shopify credentials or payment access is needed by the guide.

## Build the browser edition

Import the library as described in BUILDING.md, then:

```sh
pnpm build:web
pnpm test:web
pnpm preview:web
```

Upload the contents of `web-release` to a static host over HTTPS. The output includes the catalog, full-resolution originals, previews, PDF resources, license notices and security/cache header configuration. It excludes desktop executables and personal workbench backups.

For a deployment mounted below a URL path, set `BLACKWIRE_BASE_PATH` to a slash-terminated path such as `/bwm-guide/` when building and previewing. The server must actually mount the output at that path. Leave it unset when using a dedicated hostname such as a Pages project URL.

The `_headers` file uses the syntax supported by Cloudflare Pages. Other hosts need equivalent header settings. In particular, allow frame ancestors `https://valleytechsolutions.tech` and `https://www.valleytechsolutions.tech`; do not add `X-Frame-Options: DENY` or `SAMEORIGIN`, which would prevent the Shopify embed. The app still restricts scripts, workers and network requests to its own resources.

## Hosting requirements

The 0.6.0 build contains **7,186 files / 2.16 GB**, with a largest file of **15.86 MB**. The build report checks the 20,000-file / 25-MiB-per-file limits documented for Cloudflare Pages direct upload. This build deployed successfully. Recheck account and platform limits before future editions; larger collections may require separate object storage/CDN hosting for originals.

The Cloudflare Pages project is `valleytech-black-wire-guide`, with production branch `main`. GitHub remains the source/release location; the web app does not depend on GitHub raw-file URLs as a production image CDN. Deploy only the browser output, using an authenticated Wrangler installation:

```sh
wrangler pages deploy web-release --project-name valleytech-black-wire-guide --branch main
```

Keep hosting credentials outside the repository. The app needs no credentials at runtime.

## Connect the verified deployment

After deployment, test its real HTTPS URL, images, PDFs, mobile layout, downloads and browser storage. Generate the store page body using that verified URL:

```sh
node scripts/prepare-shopify-page.mjs https://valleytech-black-wire-guide.pages.dev/
```

This generates `data/qa/shopify/guide-page.html` from `integrations/shopify/guide-page.template.html`. Use the **The Black Wire Maker's Technical Reference Guide** title and `bwm-technical-reference-guide` page handle. Publish and add the navigation item only once the embedded guide works. The placeholder in the template is not a deployable address.

The page body contains a responsive wrapper that gives the guide more room within Shopify's narrow page layout. It adjusts only this guide section and requires no live theme-file edits. Recheck desktop and phone widths after theme changes.

## Behavior and limits

- Browser search, source credits, image/PDF viewing, original downloads and power tools share the desktop implementation.
- A board can be linked directly with `?board=<catalog-board-id>`; its viewer opens on arrival.
- The browser edition requires a connection to load references. It does not claim that the whole collection is available offline or silently cache nearly two gigabytes on a visitor's device.
- Bookmarks and measurements use browser storage. They are not customer-account records or cloud-synced data. Exported JSON backups work with the desktop edition.
- Browsers can restrict storage inside cross-site iframes. The full-screen link and backup export provide alternatives; storage failures are surfaced in the interface.
- References retain their existing attribution and rights limitations. Hosting does not establish permission for commercial printing or reuse.

## Validation recorded locally

The browser smoke test covers mounting below `/bwm-guide/`, on-demand originals, dash-aware search, image rendering, original downloads, bookmarks, direct board links, PDF pagination, the power desk, sandboxed embedding, narrow layout and the production content-security policy. The tested initial page loaded approximately **6.84 MB decoded**, with no original media files requested before opening a board.

Live checks confirmed the public HTTPS catalog, Shopify menu/page, embedded Raspberry Pi Pico 2 pinout, and 24 matching results for both `esp32-c5` and `esp32 c5`. The store page was checked at desktop and 390-pixel phone widths without horizontal page overflow. Existing navigation links and nested hardware categories were preserved.

Primary documentation: [Shopify pages and embedded content](https://help.shopify.com/en/manual/online-store/add-edit-pages), [Shopify menu links](https://help.shopify.com/en/manual/online-store/menus-and-links/editing-menus), [Cloudflare Pages direct upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).
