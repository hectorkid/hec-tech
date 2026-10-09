# HEC TECH Google Drive Worker

This backend replaces browser-side Google OAuth. The static app continues to use its current inventory JSON and PDF files in Drive's hidden `appDataFolder`. It does not migrate, clear, or rewrite the local inventory when you deploy it.

## Free plan design

- One Cloudflare Worker and one Workers KV namespace; no paid add-ons or custom domain are required.
- The Worker uses OAuth authorization-code flow and requests only `drive.appdata` plus OpenID email to restrict access to the configured Google account.
- The refresh token is AES-GCM encrypted before it is written to KV. The AES-GCM key is derived with HKDF-SHA-256 from the Google OAuth client secret, which is stored as a Cloudflare Worker secret and must never be committed here.
- Browser sessions are random, time-limited bearer tokens. Only their SHA-256 hashes are stored in KV.
- The Worker proxies only Google Drive v3 file operations and only to `www.googleapis.com` over HTTPS.

Cloudflare currently lists 100,000 Worker requests/day on Free and 100,000 KV reads/day, 1,000 KV writes/day, and 1 GB storage. Normal personal backup activity is expected to remain well below those limits. Requests stop working if a daily free allowance is exhausted; no paid plan is configured by this project.

## Deploy

### Deploy from GitHub Actions

This repository includes a manual deployment workflow so you can authorize deployment using your regular browser without sharing account credentials in chat. In `hectorkid/hec-tech`, add these under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | An account-scoped API token with Workers Scripts edit/read and Workers KV Storage edit/read permissions |
| `GOOGLE_CLIENT_ID` | The HEC TECH Drive Worker Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | The matching Google OAuth web client secret |
| `ALLOWED_GOOGLE_EMAIL` | The Google account HEC TECH should be allowed to use |

Never paste these values into an issue, pull request, source file, or chat. GitHub Actions secrets are sent to the deployment job and installed as Cloudflare Worker secrets. The workflow finds or creates the KV namespace, deploys the Worker, detects its `workers.dev` URL, and commits that URL to the selected branch. It runs when Worker files change on `feature/cloudflare-drive-oauth` or `main`. The first run will stop before changing Cloudflare if any secrets are missing. After you add them in your regular browser, open **Actions**, select the failed **Deploy HEC TECH Drive Worker** run, and choose **Re-run failed jobs**. Future Worker code updates deploy automatically.

The API token needs only the HEC TECH Cloudflare account. Cloudflare's **Edit Cloudflare Workers** token template can be narrowed to that account; include Workers KV Storage edit access for the workflow's one namespace. If the account does not yet have a `workers.dev` subdomain, enable one in Cloudflare before running the workflow.

After the workflow deploys, copy the callback URL printed in its summary (`https://hec-tech-drive.<account-subdomain>.workers.dev/oauth/callback`) into the existing Google OAuth Web client as an authorized redirect URI. Then enable the Google Drive API and authorize the account. The app update will publish to GitHub Pages after the pull request is merged.

### Deploy locally with Wrangler

Install Wrangler on a computer with Node.js, then from this repository:

```sh
npm install --save-dev wrangler
npx wrangler login
npx wrangler kv namespace create HEC_OAUTH_KV
```

Copy the returned namespace `id` into `wrangler.toml` in place of `REPLACE_WITH_CLOUDFLARE_KV_NAMESPACE_ID`. Then add these secrets. The commands prompt for each value so the values do not enter shell history:

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ALLOWED_GOOGLE_EMAIL
```

The Worker derives its AES-GCM key from `GOOGLE_CLIENT_SECRET` using HKDF-SHA-256, so no separate encryption-key secret is needed. Keep the Google client secret stable. If you rotate it, reconnect Drive so the Worker can save a newly encrypted refresh token. Do not put secrets in `wrangler.toml` or a public issue.

Deploy the Worker:

```sh
npx wrangler deploy
```

Wrangler prints the Worker URL, normally `https://hec-tech-drive.<your-account-subdomain>.workers.dev`. Add that URL as the `WORKER_BASE` in `index.html` (no trailing slash), then publish the app update to GitHub Pages.

## Google OAuth client

In Google Cloud Console, use a **Web application** OAuth client. Add the exact callback URL `https://hec-tech-drive.<your-account-subdomain>.workers.dev/oauth/callback` as an authorized redirect URI. The client ID and secret are entered into Wrangler secrets above, never source files. Enable the Google Drive API. The consent screen must allow the Google account entered as `ALLOWED_GOOGLE_EMAIL`.

On the first tap of **Back up to Drive** or **Restore from Drive**, Google will ask you to authorize HEC TECH once. After that, the app saves the session on that device and the Worker silently refreshes Google access tokens. If Google OAuth consent is left in **Testing**, Google may expire refresh tokens after seven days; set the consent screen to **In production** for continuing personal use (verification may be required depending on Google's scope and account rules).

## Local checks

```sh
npx wrangler deploy --dry-run
node --check worker/index.js
```

No secret is required for the dry run. For an end-to-end test, first authorize the configured Google account, back up, then restore on a second test browser/device and confirm the existing inventory and PDFs remain available.
