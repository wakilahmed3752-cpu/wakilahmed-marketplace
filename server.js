// Wakil Ahmed Marketplace - seller portal (single file)
const __defs = {}; const __cache = {};
function __req(name) {
  if (name in __defs) {
    if (!__cache[name]) { const m = { exports: {} }; __cache[name] = m; __defs[name](m, m.exports, __req); }
    return __cache[name].exports;
  }
  return require(name);
}
const SCHEMA = String.raw`-- Runs safely on every start (all statements are IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller','admin')),
  name            TEXT NOT NULL,
  shop_name       TEXT,
  phone           TEXT,
  category        TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','suspended')),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  payout_method   TEXT,
  payout_details  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_shop_uq  ON users (lower(shop_name)) WHERE shop_name IS NOT NULL;

CREATE TABLE IF NOT EXISTS payouts (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  currency     TEXT,
  method       TEXT,
  reference    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS earnings (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  order_id         TEXT NOT NULL,
  order_name       TEXT,
  order_date       TIMESTAMPTZ,
  currency         TEXT,
  kind             TEXT NOT NULL CHECK (kind IN ('sale','refund')),
  source_id        TEXT NOT NULL,
  gross_cents      INTEGER NOT NULL,
  rate             NUMERIC(5,2) NOT NULL,
  commission_cents INTEGER NOT NULL,
  earning_cents    INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  payout_id        INTEGER REFERENCES payouts(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, user_id, kind)
);
CREATE INDEX IF NOT EXISTS earnings_user_idx ON earnings (user_id, status);

CREATE TABLE IF NOT EXISTS processed_webhooks (
  id         TEXT PRIMARY KEY,
  topic      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    VARCHAR NOT NULL PRIMARY KEY,
  "sess"   JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`;
const CSS = String.raw`:root{--ink:#14211b;--muted:#5d6b64;--line:#e2e8e4;--bg:#f5f7f6;--paper:#fff;--brand:#1f6b4a;--brand-d:#174f37;--mint:#e6f3ec;--warn:#fff4e0;--err:#fdecea;--r:12px}
*{box-sizing:border-box}
body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg)}
.wrap{max-width:1040px;margin:0 auto;padding:0 16px}
main.wrap{padding-top:24px;padding-bottom:40px;min-height:70vh}
.top{background:var(--paper);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:60px;flex-wrap:wrap}
.brand{font-weight:700;color:var(--brand);text-decoration:none;font-size:18px}
nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
nav a,.linkbtn{color:var(--ink);text-decoration:none;font-size:15px;background:none;border:0;cursor:pointer;padding:0;font-family:inherit}
nav a:hover,.linkbtn:hover{color:var(--brand)}
h1{font-size:26px;margin:0 0 14px}h2{font-size:18px;margin:0 0 8px}
.card{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:20px;margin-bottom:16px;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.narrow{max-width:520px;margin-left:auto;margin-right:auto}
.center{text-align:center}.muted{color:var(--muted)}.small{font-size:13px}
label{display:block;font-weight:600;margin:14px 0 0}label small{font-weight:400;color:var(--muted)}
input,select,textarea{display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #cfd8d3;border-radius:8px;font:inherit;background:#fff}
input:focus,select:focus,textarea:focus{outline:2px solid var(--brand);outline-offset:1px}
.check{display:flex;gap:10px;align-items:flex-start;font-weight:400;margin-top:16px}
.check input{width:20px;height:20px;margin-top:3px;flex:none}
.btn{display:inline-block;background:var(--brand);color:#fff;border:0;border-radius:8px;padding:11px 18px;font:600 15px inherit;font-family:inherit;text-decoration:none;cursor:pointer}
.btn:hover{background:var(--brand-d)}
.btn-block{width:100%;margin-top:20px}
.btn-sm{padding:8px 12px;font-size:14px}
.btn-ghost{background:var(--mint);color:var(--brand-d)}.btn-ghost:hover{background:#d3eadd}
form.inline{display:inline-flex;gap:8px;align-items:center;margin:0}
form.inline select,form.inline input{margin:0;width:auto}
.row{display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin-top:12px}
.row input{width:auto;min-width:180px;margin:0}
.inl{display:inline-flex;align-items:center;gap:8px;margin:0;font-weight:600}
.inl input{width:90px}
.flash{border-radius:8px;padding:12px 14px;margin-bottom:16px}
.flash ul{margin:0;padding-left:18px}
.flash-ok{background:var(--mint)}.flash-error{background:var(--err);color:#8a1f17}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}
.stat{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:16px}
.stat span{display:block;color:var(--muted);font-size:13px}.stat strong{font-size:22px}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
th{color:var(--muted);font-weight:600}.r{text-align:right}
.pill{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;text-transform:capitalize;background:#eee}
.pill-approved,.pill-paid{background:var(--mint);color:var(--brand-d)}
.pill-pending,.pill-unpaid{background:var(--warn);color:#8a5a00}
.pill-rejected,.pill-suspended{background:var(--err);color:#8a1f17}
.seller-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
.seller-head p{margin:2px 0}
.amount{font-size:24px;font-weight:700;color:var(--brand)}
pre.details{white-space:pre-wrap;background:var(--bg);border-radius:8px;padding:10px;margin:8px 0 0;font:14px inherit}
.foot{color:var(--muted);font-size:13px;padding-bottom:24px}
`;

// ===== db.js =====
__defs["./db"] = function (module, exports, require) {
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL || "";
const local = /localhost|127\.0\.0\.1/.test(url);

const pool = new Pool({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
  max: 10,
});

const q = (text, params) => pool.query(text, params);

async function migrate() {
  const sql = SCHEMA;
  await pool.query(sql);
}

module.exports = { pool, q, migrate };

};

// ===== util.js =====
__defs["./util"] = function (module, exports, require) {
const { q } = require("./db");

// Lets async route handlers pass errors to Express
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Re-checks the account on every request so a suspended seller is locked out immediately
const requireRole = (role) =>
  wrap(async (req, res, next) => {
    const s = req.session.user;
    if (!s) return res.redirect("/login");
    const { rows } = await q("select role, status from users where id = $1", [s.id]);
    const u = rows[0];
    if (!u || u.status !== "approved") {
      return req.session.destroy(() => res.redirect("/login"));
    }
    if (u.role !== role) {
      return res.status(403).page("Not allowed", "<div class='card'><h1>Not allowed</h1><p>You do not have access to this page.</p></div>");
    }
    next();
  });

const toCents = (v) => Math.round(parseFloat(v || "0") * 100);

module.exports = { wrap, requireRole, toCents };

};

// ===== views.js =====
__defs["./views"] = function (module, exports, require) {
const BRAND = process.env.BRAND_NAME || "Wakil Ahmed Marketplace";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = (cents, cur = "") =>
  (Number(cents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
  (cur ? " " + esc(cur) : "");

const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const csrfField = (t) => `<input type="hidden" name="_csrf" value="${esc(t)}">`;

function layout({ title, user, body, csrf, flash }) {
  const out = `<form method="post" action="/logout" class="inline">${csrfField(csrf)}<button class="linkbtn">Sign out</button></form>`;
  let nav;
  if (!user) nav = `<a href="/login">Sign in</a><a class="btn btn-sm" href="/register">Become a seller</a>`;
  else if (user.role === "admin")
    nav = `<a href="/admin">Overview</a><a href="/admin/sellers">Sellers</a><a href="/admin/payouts">Payouts</a><a href="/admin/earnings">Earnings</a>${out}`;
  else nav = `<a href="/seller">Dashboard</a><a href="/seller/orders">Orders</a><a href="/seller/profile">Payout details</a>${out}`;

  const flashHtml = flash ? `<div class="flash flash-${esc(flash.type)}" role="status">${esc(flash.text)}</div>` : "";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#174f37">
<meta name="description" content="Wakil Ahmed Marketplace seller portal. Sign in to manage your seller account or apply to become a marketplace seller.">
<link rel="icon" type="image/jpeg" href="https://cdn.shopify.com/s/files/1/0905/1081/9694/files/wakil-ahmed-marketplace-logo.jpg?v=1795390556">
<link rel="apple-touch-icon" href="https://cdn.shopify.com/s/files/1/0905/1081/9694/files/wakil-ahmed-marketplace-logo.jpg?v=1795390556">
<title>Wakil Ahmed Marketplace | Seller Portal</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Wakil Ahmed Marketplace">
<meta property="og:title" content="Wakil Ahmed Marketplace | Seller Portal">
<meta property="og:description" content="Sign in to your seller account or apply to join Wakil Ahmed Marketplace.">
<meta property="og:url" content="https://seller.wakilahmed.com/login">
<meta property="og:image" content="https://cdn.shopify.com/s/files/1/0905/1081/9694/files/wakil-ahmed-marketplace-social.jpg?v=1795390551">
<meta property="og:image:secure_url" content="https://cdn.shopify.com/s/files/1/0905/1081/9694/files/wakil-ahmed-marketplace-social.jpg?v=1795390551">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Wakil Ahmed Marketplace official logo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Wakil Ahmed Marketplace | Seller Portal">
<meta name="twitter:description" content="Sign in to your seller account or apply to join Wakil Ahmed Marketplace.">
<meta name="twitter:image" content="https://cdn.shopify.com/s/files/1/0905/1081/9694/files/wakil-ahmed-marketplace-social.jpg?v=1795390551">
<link rel="stylesheet" href="/static/style.css">
</head><body>
<header class="top"><div class="wrap bar">
  <a class="brand" href="/">${esc(BRAND)}</a>
  <nav>${nav}</nav>
</div></header>
<main class="wrap">${flashHtml}${body}</main>
<footer class="wrap foot">&copy; ${new Date().getFullYear()} ${esc(BRAND)}</footer>
</body></html>`;
}

module.exports = { layout, esc, money, date, csrfField, BRAND };

};

// ===== auth.js =====
__defs["./auth"] = function (module, exports, require) {
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { q } = require("./db");
const { wrap } = require("./util");
const { esc, csrfField } = require("./views");

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const DUMMY = bcrypt.hashSync("timing-protection-only", 12);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

router.get("/", (req, res) => {
  const u = req.session.user;
  if (!u) return res.redirect("/login");
  res.redirect(u.role === "admin" ? "/admin" : "/seller");
});

// ---------- Register ----------
const registerForm = (csrf, v = {}, errs = []) => `
<div class="card narrow">
  <h1>Become a seller</h1>
  <p class="muted">Apply to sell on our marketplace. We review every application and email you the decision.</p>
  ${errs.length ? `<div class="flash flash-error"><ul>${errs.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>` : ""}
  <form method="post" action="/register">
    ${csrfField(csrf)}
    <label>Full name *<input name="name" required maxlength="80" value="${esc(v.name)}" autocomplete="name"></label>
    <label>Email *<input type="email" name="email" required maxlength="254" value="${esc(v.email)}" autocomplete="email"></label>
    <label>Phone / WhatsApp *<input name="phone" required maxlength="40" value="${esc(v.phone)}" autocomplete="tel"></label>
    <label>Shop / brand name * <small>(shown on your products)</small><input name="shop_name" required maxlength="60" value="${esc(v.shop_name)}"></label>
    <label>What will you sell? *<input name="category" required maxlength="120" value="${esc(v.category)}" placeholder="e.g. spices, snacks, handmade items"></label>
    <label>Password * <small>(at least 10 characters)</small><input type="password" name="password" required minlength="10" maxlength="100" autocomplete="new-password"></label>
    <label>Confirm password *<input type="password" name="password2" required minlength="10" maxlength="100" autocomplete="new-password"></label>
    <label class="check"><input type="checkbox" name="terms" value="1" required>
      <span>I agree to the seller terms, including the marketplace commission on each sale.</span></label>
    <button class="btn btn-block">Submit application</button>
  </form>
  <p class="muted center">Already approved? <a href="/login">Sign in</a></p>
</div>`;

router.get("/register", (req, res) => res.page("Become a seller", registerForm(res.locals.csrf)));

router.post(
  "/register",
  limiter,
  wrap(async (req, res) => {
    const b = req.body;
    const v = {
      name: (b.name || "").trim(),
      email: (b.email || "").trim().toLowerCase(),
      phone: (b.phone || "").trim(),
      shop_name: (b.shop_name || "").trim(),
      category: (b.category || "").trim(),
    };
    const errs = [];
    if (v.name.length < 2) errs.push("Please enter your full name.");
    if (!emailOk(v.email)) errs.push("Please enter a valid email address.");
    if (v.phone.length < 6) errs.push("Please enter a phone or WhatsApp number.");
    if (v.shop_name.length < 2) errs.push("Please enter your shop or brand name.");
    if (v.category.length < 2) errs.push("Please tell us what you will sell.");
    if ((b.password || "").length < 10) errs.push("Password must be at least 10 characters.");
    if (b.password !== b.password2) errs.push("Passwords do not match.");
    if (!b.terms) errs.push("You must accept the seller terms.");
    if (errs.length) return res.status(400).page("Become a seller", registerForm(res.locals.csrf, v, errs));

    try {
      const hash = await bcrypt.hash(b.password, 12);
      await q(
        `insert into users (email, password_hash, role, name, shop_name, phone, category, status)
         values ($1,$2,'seller',$3,$4,$5,$6,'pending')`,
        [v.email, hash, v.name, v.shop_name, v.phone, v.category]
      );
    } catch (e) {
      if (e.code === "23505")
        return res.status(400).page("Become a seller", registerForm(res.locals.csrf, v, ["An account with that email or shop name already exists."]));
      throw e;
    }
    res.page(
      "Application received",
      `<div class="card narrow center"><h1>Application received</h1>
       <p>Thank you, ${esc(v.name)}. We will review your application and email you at <strong>${esc(v.email)}</strong>.</p>
       <p class="muted">You can sign in once your account is approved.</p></div>`
    );
  })
);

// ---------- Login ----------
const loginForm = (csrf, err = "", email = "") => `
<div class="card narrow">
  <h1>Seller sign in</h1>
  ${err ? `<div class="flash flash-error">${esc(err)}</div>` : ""}
  <form method="post" action="/login">
    ${csrfField(csrf)}
    <label>Email<input type="email" name="email" required value="${esc(email)}" autocomplete="email"></label>
    <label>Password<input type="password" name="password" required autocomplete="current-password"></label>
    <button class="btn btn-block">Sign in</button>
  </form>
  <p class="muted center">New here? <a href="/register">Apply to become a seller</a></p>
</div>`;

router.get("/login", (req, res) => res.page("Sign in", loginForm(res.locals.csrf)));

router.post(
  "/login",
  limiter,
  wrap(async (req, res, next) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const fail = (msg) => res.status(401).page("Sign in", loginForm(res.locals.csrf, msg, email));
    const { rows } = await q("select * from users where lower(email) = $1", [email]);
    const u = rows[0];
    const ok = await bcrypt.compare(req.body.password || "", u ? u.password_hash : DUMMY);
    if (!u || !ok) return fail("Incorrect email or password.");
    if (u.status === "pending") return fail("Your application is still under review. We will email you once it is approved.");
    if (u.status !== "approved") return fail("This account is not active. Please contact the marketplace.");
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: u.id, role: u.role, name: u.name };
      req.session.save((e2) => (e2 ? next(e2) : res.redirect("/")));
    });
  })
);

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.redirect("/login");
  });
});

module.exports = router;

};

// ===== seller.js =====
__defs["./seller"] = function (module, exports, require) {
const router = require("express").Router();
const { q } = require("./db");
const { wrap, requireRole } = require("./util");
const { esc, money, date, csrfField } = require("./views");

router.use(requireRole("seller"));

const rowsTable = (rows) =>
  rows.length
    ? `<div class="scroll"><table>
  <tr><th>Date</th><th>Order</th><th>Type</th><th class="r">Sales</th><th class="r">Commission</th><th class="r">Your earnings</th><th>Status</th></tr>
  ${rows
    .map(
      (r) => `<tr><td>${date(r.order_date)}</td><td>${esc(r.order_name)}</td><td>${esc(r.kind)}</td>
      <td class="r">${money(r.gross_cents, r.currency)}</td><td class="r">${money(r.commission_cents, r.currency)}</td>
      <td class="r"><strong>${money(r.earning_cents, r.currency)}</strong></td>
      <td><span class="pill pill-${esc(r.status)}">${esc(r.status)}</span></td></tr>`
    )
    .join("")}
</table></div>`
    : `<p class="muted">No orders yet. Sales of your products will appear here.</p>`;

router.get(
  "/",
  wrap(async (req, res) => {
    const id = req.session.user.id;
    const { rows: [t] } = await q(
      `select coalesce(sum(gross_cents),0)::bigint sales, coalesce(sum(commission_cents),0)::bigint commission,
              coalesce(sum(earning_cents) filter (where status='unpaid'),0)::bigint unpaid,
              coalesce(sum(earning_cents) filter (where status='paid'),0)::bigint paid,
              max(currency) cur
       from earnings where user_id = $1`, [id]);
    const { rows: recent } = await q("select * from earnings where user_id=$1 order by order_date desc nulls last, id desc limit 10", [id]);
    const { rows: pays } = await q("select * from payouts where user_id=$1 order by id desc limit 10", [id]);
    const { rows: [me] } = await q("select shop_name, commission_rate from users where id=$1", [id]);
    const cur = t.cur || "";
    res.page("Dashboard", `
<h1>${esc(me.shop_name)}</h1>
<div class="stats">
  <div class="stat"><span>Balance owed to you</span><strong>${money(t.unpaid, cur)}</strong></div>
  <div class="stat"><span>Total paid out</span><strong>${money(t.paid, cur)}</strong></div>
  <div class="stat"><span>Net sales</span><strong>${money(t.sales, cur)}</strong></div>
  <div class="stat"><span>Commission (${esc(me.commission_rate)}%)</span><strong>${money(t.commission, cur)}</strong></div>
</div>
<div class="card"><h2>Recent orders</h2>${rowsTable(recent)}<p><a href="/seller/orders">View all orders</a></p></div>
<div class="card"><h2>Payment history</h2>${
      pays.length
        ? `<div class="scroll"><table><tr><th>Date</th><th>Method</th><th>Reference</th><th class="r">Amount</th></tr>${pays
            .map((p) => `<tr><td>${date(p.created_at)}</td><td>${esc(p.method)}</td><td>${esc(p.reference)}</td><td class="r">${money(p.amount_cents, p.currency)}</td></tr>`)
            .join("")}</table></div>`
        : `<p class="muted">No payouts yet.</p>`
    }</div>`);
  })
);

router.get(
  "/orders",
  wrap(async (req, res) => {
    const { rows } = await q("select * from earnings where user_id=$1 order by order_date desc nulls last, id desc limit 300", [req.session.user.id]);
    res.page("Orders", `<h1>Orders</h1><div class="card">${rowsTable(rows)}</div>`);
  })
);

router.get(
  "/profile",
  wrap(async (req, res) => {
    const { rows: [u] } = await q("select * from users where id=$1", [req.session.user.id]);
    const sel = (v) => (u.payout_method === v ? "selected" : "");
    res.page("Payout details", `
<div class="card narrow"><h1>Payout details</h1>
<p class="muted">We pay your balance to these details. Only you and the marketplace admin can see them.</p>
<form method="post" action="/seller/profile">${csrfField(res.locals.csrf)}
  <label>Phone / WhatsApp<input name="phone" maxlength="40" value="${esc(u.phone)}"></label>
  <label>Payout method<select name="payout_method">
    <option value="">Choose one</option>
    <option ${sel("Bank transfer")}>Bank transfer</option><option ${sel("PayPal")}>PayPal</option><option ${sel("Other")}>Other</option></select></label>
  <label>Account details<textarea name="payout_details" rows="4" maxlength="500" placeholder="Bank name, account name and number, or PayPal email">${esc(u.payout_details)}</textarea></label>
  <button class="btn">Save</button>
</form></div>`);
  })
);

router.post(
  "/profile",
  wrap(async (req, res) => {
    const method = ["Bank transfer", "PayPal", "Other"].includes(req.body.payout_method) ? req.body.payout_method : null;
    await q("update users set phone=$1, payout_method=$2, payout_details=$3 where id=$4", [
      (req.body.phone || "").trim().slice(0, 40),
      method,
      (req.body.payout_details || "").trim().slice(0, 500),
      req.session.user.id,
    ]);
    req.session.flash = { type: "ok", text: "Payout details saved." };
    res.redirect("/seller/profile");
  })
);

module.exports = router;

};

// ===== admin.js =====
__defs["./admin"] = function (module, exports, require) {
const router = require("express").Router();
const { pool, q } = require("./db");
const { wrap, requireRole } = require("./util");
const { esc, money, date, csrfField } = require("./views");

router.use(requireRole("admin"));

router.get(
  "/",
  wrap(async (req, res) => {
    const { rows: [s] } = await q(
      `select (select count(*) from users where role='seller' and status='pending') pending,
              (select count(*) from users where role='seller' and status='approved') approved,
              coalesce((select sum(earning_cents) from earnings where status='unpaid'),0)::bigint owed,
              coalesce((select sum(commission_cents) from earnings),0)::bigint commission,
              (select max(currency) from earnings) cur`);
    res.page("Overview", `
<h1>Marketplace overview</h1>
<div class="stats">
  <div class="stat"><span>Applications waiting</span><strong>${s.pending}</strong></div>
  <div class="stat"><span>Approved sellers</span><strong>${s.approved}</strong></div>
  <div class="stat"><span>Owed to sellers</span><strong>${money(s.owed, s.cur || "")}</strong></div>
  <div class="stat"><span>Your commission earned</span><strong>${money(s.commission, s.cur || "")}</strong></div>
</div>
<div class="card"><p><a class="btn" href="/admin/sellers">Review sellers</a> <a class="btn btn-ghost" href="/admin/payouts">Pay sellers</a></p></div>`);
  })
);

// ---------- Sellers ----------
router.get(
  "/sellers",
  wrap(async (req, res) => {
    const { rows } = await q("select * from users where role='seller' order by (status='pending') desc, created_at desc");
    const csrf = res.locals.csrf;
    const body = rows.length
      ? rows
          .map(
            (u) => `<div class="card seller">
  <div class="seller-head"><div><h2>${esc(u.shop_name)}</h2><p class="muted">${esc(u.name)} · ${esc(u.email)} · ${esc(u.phone)}</p>
  <p class="muted">Sells: ${esc(u.category)} · Applied ${date(u.created_at)}</p></div>
  <span class="pill pill-${esc(u.status)}">${esc(u.status)}</span></div>
  <div class="row">
    <form method="post" action="/admin/sellers/${u.id}/status" class="inline">${csrfField(csrf)}
      <select name="status">${["pending", "approved", "rejected", "suspended"]
        .map((s) => `<option ${u.status === s ? "selected" : ""}>${s}</option>`)
        .join("")}</select>
      <button class="btn btn-sm">Update status</button></form>
    <form method="post" action="/admin/sellers/${u.id}/commission" class="inline">${csrfField(csrf)}
      <label class="inl">Commission %<input name="rate" type="number" step="0.01" min="0" max="100" value="${esc(u.commission_rate)}"></label>
      <button class="btn btn-sm btn-ghost">Save rate</button></form>
  </div>
  <p class="muted small">Products must use the exact Vendor name <strong>${esc(u.shop_name)}</strong> in Shopify.</p>
</div>`
          )
          .join("")
      : `<div class="card"><p class="muted">No seller applications yet.</p></div>`;
    res.page("Sellers", `<h1>Sellers</h1>${body}`);
  })
);

router.post(
  "/sellers/:id/status",
  wrap(async (req, res) => {
    const status = req.body.status;
    if (!["pending", "approved", "rejected", "suspended"].includes(status)) return res.redirect("/admin/sellers");
    await q("update users set status=$1 where id=$2 and role='seller'", [status, parseInt(req.params.id, 10)]);
    req.session.flash = { type: "ok", text: "Seller status updated." };
    res.redirect("/admin/sellers");
  })
);

router.post(
  "/sellers/:id/commission",
  wrap(async (req, res) => {
    const rate = parseFloat(req.body.rate);
    if (!(rate >= 0 && rate <= 100)) {
      req.session.flash = { type: "error", text: "Commission must be between 0 and 100." };
      return res.redirect("/admin/sellers");
    }
    await q("update users set commission_rate=$1 where id=$2 and role='seller'", [rate, parseInt(req.params.id, 10)]);
    req.session.flash = { type: "ok", text: "Commission rate saved. It applies to new orders only." };
    res.redirect("/admin/sellers");
  })
);

// ---------- Payouts ----------
router.get(
  "/payouts",
  wrap(async (req, res) => {
    const { rows: due } = await q(
      `select u.id, u.shop_name, u.name, u.payout_method, u.payout_details,
              sum(e.earning_cents)::bigint owed, max(e.currency) cur
       from users u join earnings e on e.user_id=u.id and e.status='unpaid'
       group by u.id having sum(e.earning_cents) > 0 order by owed desc`);
    const { rows: hist } = await q(
      `select p.*, u.shop_name from payouts p join users u on u.id=p.user_id order by p.id desc limit 30`);
    const csrf = res.locals.csrf;
    res.page("Payouts", `
<h1>Payouts</h1>
<p class="muted">Pay the seller by bank transfer or PayPal first, then record it here. This marks their unpaid earnings as paid.</p>
${
  due.length
    ? due
        .map(
          (d) => `<div class="card"><div class="seller-head"><div><h2>${esc(d.shop_name)}</h2>
  <p class="muted">${esc(d.payout_method || "No payout method set")}</p>
  <pre class="details">${esc(d.payout_details || "No payout details provided yet.")}</pre></div>
  <div class="amount">${money(d.owed, d.cur || "")}</div></div>
  <form method="post" action="/admin/payouts/${d.id}" class="row">${csrfField(csrf)}
    <input name="reference" placeholder="Transfer reference (optional)" maxlength="100">
    <button class="btn btn-sm">Mark as paid</button></form></div>`
        )
        .join("")
    : `<div class="card"><p class="muted">No balances to pay right now.</p></div>`
}
<div class="card"><h2>Payout history</h2>${
      hist.length
        ? `<div class="scroll"><table><tr><th>Date</th><th>Seller</th><th>Method</th><th>Reference</th><th class="r">Amount</th></tr>${hist
            .map((p) => `<tr><td>${date(p.created_at)}</td><td>${esc(p.shop_name)}</td><td>${esc(p.method)}</td><td>${esc(p.reference)}</td><td class="r">${money(p.amount_cents, p.currency)}</td></tr>`)
            .join("")}</table></div>`
        : `<p class="muted">No payouts recorded yet.</p>`
    }</div>`);
  })
);

router.post(
  "/payouts/:id",
  wrap(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const reference = (req.body.reference || "").trim().slice(0, 100);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Claim the unpaid rows first so a double-click cannot pay twice
      const { rows } = await client.query(
        "update earnings set status='paid' where user_id=$1 and status='unpaid' returning id, earning_cents, currency", [userId]);
      const total = rows.reduce((a, r) => a + r.earning_cents, 0);
      if (total <= 0) {
        await client.query("ROLLBACK");
        req.session.flash = { type: "error", text: "Nothing to pay for this seller." };
        return res.redirect("/admin/payouts");
      }
      const { rows: [u] } = await client.query("select payout_method from users where id=$1", [userId]);
      const { rows: [p] } = await client.query(
        "insert into payouts (user_id, amount_cents, currency, method, reference) values ($1,$2,$3,$4,$5) returning id",
        [userId, total, rows[0].currency, u ? u.payout_method : null, reference]);
      await client.query("update earnings set payout_id=$1 where id = any($2::int[])", [p.id, rows.map((r) => r.id)]);
      await client.query("COMMIT");
      req.session.flash = { type: "ok", text: "Payout recorded." };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    res.redirect("/admin/payouts");
  })
);

// ---------- All earnings ----------
router.get(
  "/earnings",
  wrap(async (req, res) => {
    const { rows } = await q(
      `select e.*, u.shop_name from earnings e join users u on u.id=e.user_id order by e.order_date desc nulls last, e.id desc limit 300`);
    res.page("Earnings", `<h1>All seller earnings</h1><div class="card">${
      rows.length
        ? `<div class="scroll"><table><tr><th>Date</th><th>Order</th><th>Seller</th><th>Type</th><th class="r">Sales</th><th class="r">Rate</th><th class="r">Commission</th><th class="r">Seller gets</th><th>Status</th></tr>${rows
            .map((r) => `<tr><td>${date(r.order_date)}</td><td>${esc(r.order_name)}</td><td>${esc(r.shop_name)}</td><td>${esc(r.kind)}</td>
            <td class="r">${money(r.gross_cents, r.currency)}</td><td class="r">${esc(r.rate)}%</td><td class="r">${money(r.commission_cents, r.currency)}</td>
            <td class="r">${money(r.earning_cents, r.currency)}</td><td><span class="pill pill-${esc(r.status)}">${esc(r.status)}</span></td></tr>`)
            .join("")}</table></div>`
        : `<p class="muted">No orders recorded yet.</p>`
    }</div>`);
  })
);

module.exports = router;

};

// ===== webhooks.js =====
__defs["./webhooks"] = function (module, exports, require) {
const router = require("express").Router();
const crypto = require("crypto");
const { pool } = require("./db");
const { toCents } = require("./util");

const SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";

function validSignature(raw, header) {
  if (!SECRET || !header) return false;
  const expected = crypto.createHmac("sha256", SECRET).update(raw).digest("base64");
  return header.length === expected.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

async function findVendor(client, cache, name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  if (!(key in cache)) {
    const r = await client.query(
      "select id, commission_rate from users where role='seller' and status in ('approved','suspended') and lower(shop_name)=$1", [key]);
    cache[key] = r.rows[0] || null;
  }
  return cache[key];
}

// Sum line amounts per vendor. Products whose vendor is not a seller (your own products) are ignored.
async function totalsByVendor(client, items, amountOf) {
  const cache = {};
  const totals = new Map();
  for (const it of items || []) {
    const v = await findVendor(client, cache, it.vendor);
    if (!v) continue;
    const t = totals.get(v.id) || { vendor: v, cents: 0 };
    t.cents += amountOf(it);
    totals.set(v.id, t);
  }
  return [...totals.values()];
}

async function saveRow(client, r) {
  await client.query(
    `insert into earnings (user_id, order_id, order_name, order_date, currency, kind, source_id,
                           gross_cents, rate, commission_cents, earning_cents)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (source_id, user_id, kind) do nothing`,
    [r.userId, r.orderId, r.orderName, r.date, r.currency, r.kind, r.sourceId, r.gross, r.rate, r.commission, r.earning]
  );
}

async function handleSale(client, order) {
  const groups = await totalsByVendor(client, order.line_items, (it) => toCents(it.price) * (it.quantity || 0) - toCents(it.total_discount));
  for (const g of groups) {
    const rate = parseFloat(g.vendor.commission_rate);
    const commission = Math.round((g.cents * rate) / 100);
    await saveRow(client, {
      userId: g.vendor.id, orderId: String(order.id), orderName: order.name,
      date: order.processed_at || order.created_at, currency: order.currency,
      kind: "sale", sourceId: String(order.id), gross: g.cents, rate, commission, earning: g.cents - commission,
    });
  }
}

async function handleRefund(client, refund) {
  const items = (refund.refund_line_items || []).map((r) => ({
    vendor: r.line_item && r.line_item.vendor,
    amount: r.subtotal != null ? toCents(r.subtotal) : toCents(r.line_item && r.line_item.price) * (r.quantity || 0),
    currency: r.subtotal_set && r.subtotal_set.shop_money && r.subtotal_set.shop_money.currency_code,
  }));
  const groups = await totalsByVendor(client, items, (it) => it.amount);
  const orderId = String(refund.order_id);
  for (const g of groups) {
    const prev = await client.query(
      "select rate, order_name, currency from earnings where order_id=$1 and user_id=$2 and kind='sale' limit 1", [orderId, g.vendor.id]);
    const rate = prev.rows[0] ? parseFloat(prev.rows[0].rate) : parseFloat(g.vendor.commission_rate);
    const commission = Math.round((g.cents * rate) / 100);
    await saveRow(client, {
      userId: g.vendor.id, orderId, orderName: prev.rows[0] ? prev.rows[0].order_name : "Order " + orderId,
      date: refund.processed_at || refund.created_at, currency: prev.rows[0] ? prev.rows[0].currency : null,
      kind: "refund", sourceId: String(refund.id), gross: -g.cents, rate, commission: -commission, earning: -(g.cents - commission),
    });
  }
}

// Shopify webhook endpoint: POST /webhooks/shopify  (topics: orders/paid, refunds/create)
router.post("/shopify", require("express").raw({ type: "application/json", limit: "5mb" }), async (req, res) => {
  if (!validSignature(req.body, req.get("X-Shopify-Hmac-Sha256"))) return res.status(401).send("Invalid signature");

  const topic = req.get("X-Shopify-Topic");
  let body;
  try { body = JSON.parse(req.body.toString("utf8")); } catch { return res.status(400).send("Bad JSON"); }
  const hookId = req.get("X-Shopify-Webhook-Id") || `${topic}:${body.id}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Shopify can deliver the same webhook more than once; process each only once
    const seen = await client.query("insert into processed_webhooks (id, topic) values ($1,$2) on conflict do nothing returning id", [hookId, topic]);
    if (!seen.rowCount) { await client.query("ROLLBACK"); return res.sendStatus(200); }
    if (topic === "orders/paid") await handleSale(client, body);
    else if (topic === "refunds/create") await handleRefund(client, body);
    await client.query("COMMIT");
    res.sendStatus(200);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("webhook error", e);
    res.sendStatus(500); // Shopify will retry
  } finally {
    client.release();
  }
});

module.exports = router;

};

// ===== main =====
const express = require("express");
const helmet = require("helmet");
const session = require("express-session");
const PgStore = require("connect-pg-simple")(session);
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const path = require("path");
const { pool, q, migrate } = __req("./db");
const { layout } = __req("./views");

const app = express();
app.set("trust proxy", 1); // Render sits behind a proxy
app.use(helmet());

// Webhooks need the raw body, so they are mounted before the form parser
app.use("/webhooks", __req("./webhooks"));

app.get("/static/style.css", (_req, res) => res.type("text/css").set("Cache-Control", "public, max-age=86400").send(CSS));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

app.use(
  session({
    store: new PgStore({ pool, tableName: "session" }),
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 },
  })
);

// CSRF protection, flash messages, and the res.page() helper
app.use((req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString("hex");
  res.locals.csrf = req.session.csrf;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  if (req.method === "POST") {
    const t = String(req.body._csrf || "");
    const ok = t.length === req.session.csrf.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(req.session.csrf));
    if (!ok) return res.status(403).send("Your session expired. Go back, refresh the page, and try again.");
  }
  res.page = (title, body) =>
    res.send(layout({ title, user: req.session.user, body, csrf: res.locals.csrf, flash: res.locals.flash }));
  next();
});

app.get("/healthz", (_req, res) => res.send("ok"));

app.get("/googlef773f6d44fa4fd9f.html", (_req, res) => res.type("text/plain").send("google-site-verification: googlef773f6d44fa4fd9f.html"));
app.use("/", __req("./auth"));
app.use("/seller", __req("./seller"));
app.use("/admin", __req("./admin"));

app.use((req, res) => res.status(404).page("Not found", "<div class='card'><h1>Page not found</h1><p><a href='/'>Go home</a></p></div>"));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).page("Error", "<div class='card'><h1>Something went wrong</h1><p>Please try again.</p></div>");
});

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const pass = process.env.ADMIN_PASSWORD || "";
  if (!email || pass.length < 10) return console.log("No admin created (set ADMIN_EMAIL and a 10+ character ADMIN_PASSWORD).");
  const hash = await bcrypt.hash(pass, 12);
  const r = await q(
    `insert into users (email, password_hash, role, name, status) values ($1,$2,'admin','Marketplace admin','approved')
     on conflict (lower(email)) do nothing`, [email, hash]);
  if (r.rowCount) console.log("Admin account created for " + email);
}

(async () => {
  for (const k of ["DATABASE_URL", "SESSION_SECRET"]) if (!process.env[k]) throw new Error(`Missing environment variable ${k}`);
  await migrate();
  await ensureAdmin();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log("Marketplace running on port " + port));
})().catch((e) => { console.error(e); process.exit(1); });

