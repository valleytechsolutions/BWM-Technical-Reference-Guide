# Maintaining a useful, discoverable maker reference

The public name is **The Black Wire Maker's Technical Reference Guide**. App 0.6.0 retains First Edition / 2026 and collection snapshot 2026.09.5. Software presentation changes do not create a new book edition.

## Public entry points

- [Interactive guide](https://valleytech-black-wire-guide.pages.dev/): canonical URL for the app; crawlable initial HTML describes it and links to documentation.
- [Reference wiki](https://valleytech-black-wire-guide.pages.dev/wiki/): eight original guides, board and maker directories, and 21 family/category pages. Static HTML works without JavaScript. Every catalog listing has a direct app link and a coverage label.
- [Valleytech store page](https://valleytechsolutions.tech/pages/bwm-technical-reference-guide): a useful introduction, wiki/download links and the embedded app. The existing handle and store navigation stay stable.
- [App GitHub wiki](https://git.churchofmalware.org/Valleytech/BWM-Technical-Reference-Guide/wiki): the same practical guide text, maintained from the versioned source.
- The app and collection READMEs link to the guide, documentation, actual downloads and contribution paths. Repository topics describe real supported subjects.

## How it is built

`data/wiki.mjs` is the original wiki text. `scripts/build-wiki.mjs` generates HTML directories from the imported catalog and Markdown documentation from that text. Run `pnpm wiki:docs` after editing articles. `pnpm build:web` generates the wiki, robots.txt and sitemap.xml in `web-release`. Publish only that folder.

The root and wiki pages include unique titles/descriptions, canonical URLs and social metadata. The app has WebApplication structured data; directory pages use CollectionPage. There are no invented reviews, star ratings or completeness claims. `scripts/build-social-card.mjs` generates the 1200 × 630 share card from code and the unchanged supplied logo.

The sitemap has 33 URLs in this release: the app, wiki home, eight articles, two directory indexes and 21 category/family directories. Query-string records remain navigable app links; thousands of duplicate, thin SEO pages are not generated.

Shopify uses its supported `global.title_tag` and `global.description_tag` page metadata. The guide page body is maintained in `integrations/shopify/guide-page.template.html`. Preserve the iframe sandbox and store security settings.

## Quality gates

Run unit tests, browser pin-reference tests, `pnpm test:theme` and packaged Electron checks. Verify the deployed Shopify embed and wiki. The theme test covers local preference persistence, blocked storage, mobile layout, original image colors, static content without JavaScript, sitemap destinations and structured-data syntax.

SEO metadata makes discovery possible; it does not guarantee indexing or rankings. Search Console verification, sitemap submission and search analytics have not been configured by this release. Those require the site owner's existing access or a separately authorized setup. No analytics tracker was added.

## Community priorities

1. Resolve documented model/revision and physical-pinout gaps before expanding broad completeness claims.
2. Accept corrections with exact model, connector, orientation, source and rights evidence. Give contributors a reproducible app issue form and a reference correction form.
3. Keep source artwork and original hashes intact; attach review notes to each reference. A family name does not establish clone wiring.
4. Expand practical wiki examples from questions that recur in real projects. Link each electrical statement to primary documentation.
5. Track whether people can find the correct record and interpret its status. Search volume alone is not evidence of a reliable technical resource.

Primary guidance: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app), [GitHub repository topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics), [Shopify storefront SEO](https://shopify.dev/docs/apps/build/marketing/optimize-storefront-seo).
