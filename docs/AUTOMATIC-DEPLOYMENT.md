# Automatic website updates

A GitHub workflow is a saved set of steps GitHub runs for you. This repository's **Check and publish the website guide** workflow checks changes, builds the guide and publishes the website after changes reach `main`.

## For Kal and Dagnazty

1. Work on a branch and open a pull request.
2. Let the source and browser-guide checks pass. Review the changes, then merge into `main`.
3. Open the repository's **Actions** tab. The website workflow builds the exact pinned pinout collection, tests the app and publishes `web-release` to the existing Cloudflare Pages project.
4. A successful **Publish website guide** job means the new files and Shopify embed were checked. Visitors use the same guide address; no Shopify page editing is needed for each app update.

Branch pushes and pull requests do not publish production. A direct push to `main` also publishes, so use pull requests when you want review first. Tests reduce regressions; they do not guarantee every board's electrical data or every interaction is correct. Failed build/test/upload steps leave the previous successful deployment in place. A verification failure after upload needs investigation because the new deployment may already be live.

The **Run workflow** button can retry the current `main` version. To undo a bad code change, revert its merge on `main`; the resulting commit publishes through the same checks. An urgent rollback can also use Cloudflare's deployment history, followed by a source revert so the next merge does not reintroduce it.

## One-time connection

Use the GitHub environment **guide-production**, restricted to the **main branch only**, with two encrypted environment secrets:

- `CLOUDFLARE_API_TOKEN`: a dedicated Cloudflare token with **Account → Cloudflare Pages → Edit** for the hosting account.
- `CLOUDFLARE_ACCOUNT_ID`: the hosting account ID.

The token's Pages permission is account-scoped; the workflow targets only `valleytech-black-wire-guide`. It needs no Shopify credentials, customer data, DNS permissions or billing permissions. Never put the token in code, a commit, an issue or a chat message. Rotate/revoke it in Cloudflare and replace the GitHub environment secret when necessary.

The repository variable **GUIDE_AUTO_DEPLOY_ENABLED** must be `true` to publish. Until then, the workflow only builds and checks. Set it to `false` to pause automatic publication while keeping validation running. Configure the secrets and branch restriction before enabling it.

GitHub hosts the runner; Kal's computer can be off. This uses the existing Pages project and standard public-repository runners, with no new paid service or retained multi-gigabyte workflow artifacts configured. Provider limits still apply.

## What updates automatically

- The browser app, static reference wiki, catalog and original reference files used on the Valleytech Shopify guide page.
- Only the collection commit in `data/library-source.json`. Merging the pinout repository alone does not silently replace the reviewed collection. Update that pin in an app pull request when a new collection is ready.

Desktop installers, signed releases, GitHub wiki pages, local computer copies, the shop's surrounding page text and the physical book are separate. This workflow does not publish or alter them. First Edition / 2026 stays independent of app versions and collection snapshots.

## How publication is checked

The shared build action imports the pinned collection, checks original-file hashes and documentation, runs source/package/search tests, builds the app/wiki and runs the browser smoke test. Output checks reject private workbench files, unexpected output directories, private path patterns and Cloudflare file/count limit violations. Credentials are supplied only to the publish step, not the build.

The workflow serializes publications and skips a build if a newer `main` commit already exists. `/build-info.json` records public app/collection commit IDs. After uploading, the workflow checks the production build identity, catalog, app assets, wiki, an original pinout hash and the Shopify iframe. Workflow logs and the step summary show results; they must never print tokens.

[GitHub workflow](../.github/workflows/deploy-guide.yml) · [Cloudflare's CI deployment guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) · [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
