# HEC TECH shared product catalog

The `products` D1 table stores reusable catalog facts only: product name, brand,
model, barcode, category, and HTTPS links to product pages, product photos, or
manual PDFs. It must never store serial numbers, personal photos, receipts,
notes, locations, quantities, or a person's inventory records.

## Cloudflare deployment

The existing `deploy-lookup.yml` workflow uses the repository's Cloudflare
secrets. It now finds or creates `hec-tech-product-catalog`, applies the D1
migration, then deploys the lookup Worker. Keep the existing
`CLOUDFLARE_API_TOKEN` for Worker deployment. Add `CLOUDFLARE_D1_API_TOKEN` as
a separate GitHub Actions secret with only Cloudflare D1 Read and D1 Write
permissions if the existing Worker deployment token lacks D1 access. The
workflow tries `CLOUDFLARE_D1_API_TOKEN` first and falls back to the existing
`CLOUDFLARE_API_TOKEN`.

From the repository root, manual local setup is also available with Wrangler:

```sh
npx wrangler d1 create hec-tech-product-catalog --config wrangler.lookup.toml
```

Copy the returned database ID into `wrangler.lookup.toml` at
`[[d1_databases]].database_id`, then run:

```sh
npx wrangler d1 migrations apply hec-tech-product-catalog --config wrangler.lookup.toml --remote
npx wrangler secret put CATALOG_WRITE_TOKEN --config wrangler.lookup.toml
npx wrangler deploy --config wrangler.lookup.toml
```

Use a long random token for `CATALOG_WRITE_TOKEN`. Keep it in the Cloudflare
Worker secret store and never put it in the app or GitHub Pages. For automatic
Worker configuration, store it as a GitHub Actions secret named
`CATALOG_WRITE_TOKEN`; the deployment workflow will install it when present.

## Adding reusable product records

Catalog writes require the Worker secret and reject fields outside the public
product allowlist. Example for an authorized catalog maintainer:

```sh
curl -X POST 'https://hec-tech-lookup.hectech.workers.dev/product-lookup' \
  -H 'Origin: https://hectorkid.github.io' \
  -H 'Authorization: Bearer YOUR_CATALOG_WRITE_TOKEN' \
  -H 'Content-Type: application/json' \
  --data '{"name":"Example Drill","brand":"Example","model":"EX-123","category":"Power Tools","productUrl":"https://example.com/product","photoUrl":"https://example.com/product.jpg","manualUrl":"https://example.com/manual.pdf"}'
```

Barcode lookup matches an exact GTIN/UPC/EAN. Model lookup uses normalized
brand/model/name keys. The browser app sends lookup terms only; local inventory
fields and private images never go to the catalog Worker. Catalog photos are
displayed as remote previews. Manual URLs open as links and do not download
until the user chooses to save or upload a PDF to their own inventory.
