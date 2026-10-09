# HEC TECH Google Drive Worker

This backend replaces browser-side Google OAuth. The static app continues to use its current inventory JSON and PDF files in Drive's hidden `appDataFolder`. It does not migrate, clear, or rewrite the local inventory when you deploy it.

## Free plan design

- One Cloudflare Worker and one Workers KV namespace; no paid add-ons or custom domain are required.
- The Worker uses OAuth authorization-code flow and requests only `drive.appdata` plus OpenID email to restrict access to the configured Google account.
- The refresh token is AES-GCM encrypted before it is written to KV. The encryption key and Google OAuth client credentials are Cloudflare Worker secrets and must never be committed here.
- Browser sessions are random, time-limited bearer tokens. Only their SHA-256 hashes are stored in KV.
- The Worker proxies only Google Drive v3 file operations and only to `www.googleapis.com` over HTTPS.

Cloudflare currently lists 100,000 Worker requests/day on Free and 100,000 KV reads/day, 1,000 KV writes/day, and 1 GB storage. Normal personal backup activity is expected to remain well below those limits. Requests stop working if a daily free allowance is exhausted; no paid plan is configured by this project.

## Deploy

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
npx wrangler secret put TOKEN_ENCRYPTION_KEY
```

Generate the encryption key locally with `openssl rand -base64 32` and paste it into the Wrangler prompt. Keep a private recovery copy. If this key is lost, the stored refresh token cannot be decrypted and Google Drive must be connected again. Do not put secrets in GitHub, `wrangler.toml`, or a public issue.

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
