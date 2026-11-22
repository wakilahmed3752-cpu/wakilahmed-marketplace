# Wakil Ahmed Marketplace – Seller Portal

A Node.js + PostgreSQL seller portal. The whole app is two files:

- `package.json` – the list of packages and the start command
- `server.js` – the full app (seller signup, login, admin approval, commission, earnings, payouts, Shopify webhooks)

## What it does

- Sellers apply at `/register`. You approve or reject them at `/admin/sellers`.
- You set each seller's commission rate.
- Shopify sends paid orders and refunds to `/webhooks/shopify`. Items are matched to sellers by the product **Vendor** field, which must exactly equal the seller's shop name.
- Sellers see their balance, orders and payment history at `/seller`.
- You record payouts at `/admin/payouts` after paying sellers by bank transfer or PayPal.

## Deploy on Render

1. Upload `package.json` and `server.js` to the top level of your GitHub repo (branch `main`).
2. In Render, create a **Web Service** (not a Static Site) from that repo.
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
3. Add the environment variables below.
4. Render redeploys automatically on every GitHub commit.

## Environment variables

Set these in Render → your service → Environment. Never put them in GitHub.

| Name | Value |
|---|---|
| `DATABASE_URL` | Internal Database URL from your Render Postgres page |
| `SESSION_SECRET` | A long random string, 40+ characters |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Your admin password, 10+ characters |
| `SHOPIFY_WEBHOOK_SECRET` | Your Shopify webhook signing secret |
| `NODE_ENV` | `production` |
| `BRAND_NAME` | Optional name shown in the header |

The database tables are created automatically on first start. Existing data is never deleted.

## First sign-in

1. Open your service address, for example `https://wakil-marketplace-portal.onrender.com`.
2. Go to `/login` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Open **Sellers** to review applications.

## Shopify webhooks

Shopify admin → Settings → Notifications → Webhooks → Create webhook. Format: JSON.

1. Event **Order payment** → `https://YOUR-SERVICE.onrender.com/webhooks/shopify`
2. Event **Refund create** → same address

Add these only after the portal is running. The signing secret shown at the top of the Webhooks page is the value for `SHOPIFY_WEBHOOK_SECRET`.

## Paying sellers

1. Open `/admin/payouts`.
2. Pay the seller outside the portal (bank or PayPal).
3. Tap **Mark as paid** and add the transfer reference.

## Not built yet

- Seller product listing (draft products sent to Shopify)
- Password reset and email verification by email

## Troubleshooting

- **"Missing environment variable"** in the logs: add `DATABASE_URL` and `SESSION_SECRET`.
- **Build fails with "Could not read package.json"**: the two files are not in the repo, or are inside a folder.
- **Seller sales not showing**: the product's Vendor in Shopify must match the seller's shop name exactly, and the seller must be approved.
- **First page load is slow**: Render's free plan sleeps when idle and takes about a minute to wake.
