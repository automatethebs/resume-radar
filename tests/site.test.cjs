"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const site = path.resolve(__dirname, "../site");
const { roles } = require(path.join(site, "assets/roles.js"));
const configSrc = fs.readFileSync(path.join(site, "assets/config.js"), "utf8");
const siteUrl = (configSrc.match(/siteUrl:\s*"([^"]+)"/) || [])[1];
const supportUrl = (configSrc.match(/supportUrl:\s*"([^"]+)"/) || [])[1];
const usdcAddress = (configSrc.match(/address:\s*"([^"]+)"/) || [])[1];

test("landing page contains the scanner and its dependencies", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  ["id=\"resume\"", "id=\"job\"", "id=\"role\"", "id=\"report\"", "id=\"scanner-form\""].forEach((needle) => {
    assert.ok(html.includes(needle), `index.html missing ${needle}`);
  });
  ["assets/engine.js", "assets/roles.js", "assets/app.js", "assets/site.js", "assets/config.js", "assets/payments.js"].forEach((src) => {
    assert.ok(html.includes(src), `index.html missing ${src}`);
  });
  assert.ok(html.indexOf("assets/engine.js") < html.indexOf("assets/app.js"), "engine must load before app");
});

test("every role has a generated page with a unique title and canonical", () => {
  roles.forEach((role) => {
    const file = path.join(site, "roles", `${role.slug}.html`);
    assert.ok(fs.existsSync(file), `missing ${file}`);
    const html = fs.readFileSync(file, "utf8");
    assert.ok(html.includes(`<h1>ATS Resume Checker for ${role.plural}</h1>`), `${role.slug} missing h1`);
    assert.ok(html.includes(`${siteUrl}/roles/${role.slug}.html`), `${role.slug} missing canonical`);
    assert.ok(html.includes("FAQPage"), `${role.slug} missing FAQ schema`);
    assert.ok(html.includes("data-copy"), `${role.slug} missing copy chips`);
    assert.ok(html.includes(`?role=${role.slug}`), `${role.slug} missing preselected checker link`);
  });
});

test("sitemap lists every page and robots points to it", () => {
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  roles.forEach((role) => {
    assert.ok(sitemap.includes(`${siteUrl}/roles/${role.slug}.html`), `sitemap missing ${role.slug}`);
  });
  ["index.html", "roles.html", "pricing.html", "how-it-works.html", "privacy.html", "terms.html", "keyword-extractor.html"].forEach((page) => {
    const url = page === "index.html" ? `${siteUrl}/` : `${siteUrl}/${page}`;
    assert.ok(sitemap.includes(url), `sitemap missing ${page}`);
  });
  const robots = fs.readFileSync(path.join(site, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "robots missing sitemap URL");
});

test("pricing and unlock flows are wired", () => {
  const pricing = fs.readFileSync(path.join(site, "pricing.html"), "utf8");
  assert.ok(pricing.includes("data-pay"), "pricing missing payment CTA");
  assert.ok(pricing.includes("data-unlock"), "pricing missing unlock CTA");
  assert.ok(pricing.includes("data-price"), "pricing missing price placeholder");
  assert.ok(pricing.includes("data-crypto"), "pricing missing USDC CTA");
  assert.ok(pricing.includes("data-payment-note"), "pricing missing dynamic payment note");
  const siteJs = fs.readFileSync(path.join(site, "assets/site.js"), "utf8");
  assert.ok(siteJs.includes("rr_pro_v1"), "unlock storage key missing");
  assert.ok(siteJs.includes("paymentLink"), "payment link config not read");
  assert.ok(siteJs.includes("verifyUsdcTx"), "USDC verification not wired");
  assert.ok(configSrc.includes(usdcAddress), "USDC address is not configured");
});

test("support is a real URL, not a placeholder inbox", () => {
  assert.match(supportUrl, /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues$/, "supportUrl should be an issue tracker URL");
  assert.ok(!configSrc.includes("hello@resumeradar.example"), "placeholder support email still present");
  ["index.html", "pricing.html", "how-it-works.html", "privacy.html", "terms.html", "404.html"].forEach((page) => {
    const html = fs.readFileSync(path.join(site, page), "utf8");
    assert.ok(html.includes(supportUrl), `${page} missing support link`);
  });
});

test("no placeholder domain or email is shipped", () => {
  const files = [];
  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|js|xml|txt|webmanifest)$/.test(entry.name)) files.push(full);
    });
  }
  walk(site);
  assert.ok(files.length > 30, "expected a built site");
  files.forEach((file) => {
    const text = fs.readFileSync(file, "utf8");
    assert.ok(!text.includes("resumeradar.example"), `${path.relative(site, file)} still contains the placeholder domain`);
    assert.ok(!text.includes("hello@resumeradar.example"), `${path.relative(site, file)} still contains the placeholder email`);
  });
});

test("keyword extractor is a real, wired page and hands off to the scanner", () => {
  const html = fs.readFileSync(path.join(site, "keyword-extractor.html"), "utf8");
  ["id=\"job-text\"", "id=\"extractor-role\"", "id=\"keyword-results\"", "id=\"extractor-form\"", "assets/extractor.js", "assets/engine.js"].forEach((needle) => {
    assert.ok(html.includes(needle), `keyword-extractor.html missing ${needle}`);
  });
  assert.ok(html.includes(`${siteUrl}/keyword-extractor.html`), "keyword extractor missing canonical");
  assert.ok(html.includes("FAQPage"), "keyword extractor missing FAQ schema");
  assert.ok(html.includes("index.html#checker"), "keyword extractor missing scanner CTA");

  const extractorJs = fs.readFileSync(path.join(site, "assets/extractor.js"), "utf8");
  assert.ok(extractorJs.includes("extractJdKeywords"), "extractor does not call the engine");
  assert.ok(extractorJs.includes("rr_job_prefill"), "extractor does not hand off the posting");
  assert.ok(extractorJs.includes("data-copy"), "extractor keywords are not copyable");

  const appJs = fs.readFileSync(path.join(site, "assets/app.js"), "utf8");
  assert.ok(appJs.includes("rr_job_prefill"), "scanner does not read the extractor handoff");

  const indexHtml = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.ok(indexHtml.includes("keyword-extractor.html"), "homepage does not link to the extractor");
});

test("report has a share loop and a wallet handoff", () => {
  const appJs = fs.readFileSync(path.join(site, "assets/app.js"), "utf8");
  assert.ok(appJs.includes("shareReport"), "shareReport missing");
  assert.ok(appJs.includes("data-share"), "share button missing");
  assert.ok(appJs.includes("navigator.share"), "native share missing");
  const siteJs = fs.readFileSync(path.join(site, "assets/site.js"), "utf8");
  assert.ok(siteJs.includes("ethereum:"), "EIP-681 wallet URI missing");
  assert.ok(siteJs.includes("Open in wallet"), "wallet link missing");
  const notFound = fs.readFileSync(path.join(site, "404.html"), "utf8");
  assert.ok(notFound.includes(`<base href="${siteUrl}/">`), "404 page needs a base URL for nested missing paths");
});
