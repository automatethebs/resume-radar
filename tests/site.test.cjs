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
  ["index.html", "roles.html", "pricing.html", "how-it-works.html", "privacy.html", "terms.html", "keyword-extractor.html", "web3.html", "pay-with-usdc.html"].forEach((page) => {
    const url = page === "index.html" ? `${siteUrl}/` : `${siteUrl}/${page}`;
    assert.ok(sitemap.includes(url), `sitemap missing ${page}`);
  });
  const robots = fs.readFileSync(path.join(site, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "robots missing sitemap URL");
  assert.ok(!sitemap.includes("<lastmod>"), "sitemap must not stamp every URL with the build date");
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

test("USDC buyers can restore Pro from a transaction link", () => {
  const siteJs = fs.readFileSync(path.join(site, "assets/site.js"), "utf8");
  assert.ok(siteJs.includes("function restoreUrl"), "restoreUrl helper missing");
  assert.ok(siteJs.includes("?tx="), "restore link does not include the transaction hash");
  assert.ok(siteJs.includes("Restoring Pro from your payment"), "restore link does not auto-verify");
  assert.ok(siteJs.includes("restoreUrl: restoreUrl"), "restoreUrl is not exposed to the report");
  const appJs = fs.readFileSync(path.join(site, "assets/app.js"), "utf8");
  assert.ok(appJs.includes("Keep your Pro access"), "report missing the Pro access card");
  assert.ok(appJs.includes("pro-access-slot"), "report missing the restore card slot");
  assert.ok(appJs.includes("mountProAccess"), "restore card is not mounted after unlock");
  const css = fs.readFileSync(path.join(site, "assets/styles.css"), "utf8");
  assert.ok(css.includes(".restore-row"), "restore link styles missing");
});

test("pricing page exposes product and FAQ structured data", () => {
  const pricing = fs.readFileSync(path.join(site, "pricing.html"), "utf8");
  assert.ok(pricing.includes('"@type": "Product"'), "pricing missing Product schema");
  assert.ok(pricing.includes('"price": "9.00"'), "pricing schema missing the $9 offer");
  assert.ok(pricing.includes('"@type": "FAQPage"'), "pricing missing FAQ schema");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok((sitemap.match(/<url>/g) || []).length >= 45, "sitemap should include all 45 launch URLs");
});

test("support is a real URL, not a placeholder inbox", () => {
  assert.match(supportUrl, /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues$/, "supportUrl should be an issue tracker URL");
  assert.ok(!configSrc.includes("hello@resumeradar.example"), "placeholder support email still present");
  ["index.html", "pricing.html", "how-it-works.html", "privacy.html", "terms.html", "404.html", "web3.html", "pay-with-usdc.html"].forEach((page) => {
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

test("Web3 landing page and USDC guide are wired", () => {
  const web3 = fs.readFileSync(path.join(site, "web3.html"), "utf8");
  assert.ok(web3.includes(`${siteUrl}/web3.html`), "web3 missing canonical");
  assert.ok(web3.includes("FAQPage"), "web3 missing FAQ schema");
  assert.ok(web3.includes("pay-with-usdc.html"), "web3 missing payment guide link");
  ["smart-contract-engineer", "blockchain-developer", "defi-analyst", "web3-product-manager", "crypto-community-manager"].forEach((slug) => {
    assert.ok(web3.includes(`roles/${slug}.html`), `web3 missing ${slug}`);
    assert.ok(fs.existsSync(path.join(site, "roles", `${slug}.html`)), `missing ${slug} page`);
  });

  const guide = fs.readFileSync(path.join(site, "pay-with-usdc.html"), "utf8");
  assert.ok(guide.includes(`${siteUrl}/pay-with-usdc.html`), "guide missing canonical");
  assert.ok(guide.includes("8453"), "guide missing Base chain id");
  assert.ok(guide.includes(usdcAddress), "guide missing the configured USDC address");
  assert.ok(guide.includes("data-usdc-address"), "guide missing dynamic address hook");
  assert.ok(guide.includes("data-copy-usdc"), "guide missing copy-address hook");
  assert.ok(guide.includes("assets/usdc-qr.svg"), "guide missing payment QR");
  const siteJs = fs.readFileSync(path.join(site, "assets/site.js"), "utf8");
  assert.ok(siteJs.includes("data-usdc-address"), "site.js does not hydrate the USDC address");
});

test("Pro report includes a cover-letter outline and interview questions", () => {
  const appJs = fs.readFileSync(path.join(site, "assets/app.js"), "utf8");
  assert.ok(appJs.includes("proPlaybook"), "proPlaybook helper missing");
  assert.ok(appJs.includes("renderProPlaybook"), "renderProPlaybook missing");
  assert.ok(appJs.includes("Cover letter outline"), "cover-letter heading missing");
  assert.ok(appJs.includes("Interview questions"), "interview heading missing");
  assert.ok(appJs.includes("PRO PLAYBOOK"), "text export missing the playbook");
  const css = fs.readFileSync(path.join(site, "assets/styles.css"), "utf8");
  assert.ok(css.includes(".pro-playbook"), "playbook styles missing");
});

test("report has a share loop and a wallet handoff", () => {
  const appJs = fs.readFileSync(path.join(site, "assets/app.js"), "utf8");
  assert.ok(appJs.includes("shareReport"), "shareReport missing");
  assert.ok(appJs.includes("data-share"), "share button missing");
  assert.ok(appJs.includes("navigator.share"), "native share missing");
  assert.ok(appJs.includes("linkedin.com/sharing"), "LinkedIn share link missing");
  assert.ok(appJs.includes("twitter.com/intent"), "X share link missing");
  assert.ok(appJs.includes("sample-report.html"), "locked report does not link the sample report");
  const siteJs = fs.readFileSync(path.join(site, "assets/site.js"), "utf8");
  assert.ok(siteJs.includes("ethereum:"), "EIP-681 wallet URI missing");
  assert.ok(siteJs.includes("Open in wallet"), "wallet link missing");
  assert.ok(siteJs.includes("data-wallet-pay"), "wallet pay button missing");
  assert.ok(siteJs.includes("payFromWallet"), "wallet payment flow missing");
  assert.ok(siteJs.includes("wallet_switchEthereumChain"), "Base chain switch missing");
  const payJs = fs.readFileSync(path.join(site, "assets/payments.js"), "utf8");
  assert.ok(payJs.includes("encodeErc20Transfer"), "ERC-20 transfer encoder missing");
  const css = fs.readFileSync(path.join(site, "assets/styles.css"), "utf8");
  assert.ok(css.includes(".wallet-pay"), "wallet payment styles missing");
  const notFound = fs.readFileSync(path.join(site, "404.html"), "utf8");
  assert.ok(notFound.includes(`<base href="${siteUrl}/">`), "404 page needs a base URL for nested missing paths");
});

test("the ATS format guide is a complete, crawlable article", () => {
  const html = fs.readFileSync(path.join(site, "ats-resume-format.html"), "utf8");
  assert.ok(html.includes(`${siteUrl}/ats-resume-format.html`), "format guide missing canonical");
  assert.ok(html.includes("FAQPage"), "format guide missing FAQ schema");
  assert.ok(html.includes("template-block"), "format guide missing the parse-safe skeleton");
  assert.ok(html.includes("free-ats-resume-template.html"), "format guide missing template CTA");
  assert.ok(html.includes("index.html#checker"), "format guide missing scanner CTA");
});

test("the free template page has working copy, download, and print controls", () => {
  const html = fs.readFileSync(path.join(site, "free-ats-resume-template.html"), "utf8");
  assert.ok(html.includes(`${siteUrl}/free-ats-resume-template.html`), "template page missing canonical");
  assert.ok(html.includes("FAQPage"), "template page missing FAQ schema");
  assert.ok(html.includes('id="resume-template"'), "template text container missing");
  ["data-copy-template", "data-download-template", "data-print-template"].forEach((hook) => {
    assert.ok(html.includes(hook), `template page missing ${hook}`);
  });
  assert.ok(html.includes("assets/template.js"), "template page missing its script");
  assert.ok(html.includes("assets/ats-resume-checklist.pdf"), "template page missing the checklist PDF link");
  const js = fs.readFileSync(path.join(site, "assets/template.js"), "utf8");
  assert.ok(js.includes("navigator.clipboard"), "copy control does not use the clipboard");
  assert.ok(js.includes("ats-resume-template.txt"), "download control missing a filename");
  assert.ok(js.includes("window.print"), "print control missing");
});

test("the printable ATS checklist PDF ships and is linked", () => {
  const pdfPath = path.join(site, "assets/ats-resume-checklist.pdf");
  assert.ok(fs.existsSync(pdfPath), "missing ats-resume-checklist.pdf");
  const pdf = fs.readFileSync(pdfPath);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-", "checklist is not a PDF");
  assert.ok(pdf.length > 20000, "checklist PDF is unexpectedly small");
  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  assert.ok(guides.includes("assets/ats-resume-checklist.pdf"), "guide hub does not link the checklist PDF");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${siteUrl}/assets/ats-resume-checklist.pdf`), "sitemap missing the checklist PDF");
  const llms = fs.readFileSync(path.join(site, "llms.txt"), "utf8");
  assert.ok(llms.includes("assets/ats-resume-checklist.pdf"), "llms.txt missing the checklist PDF");
});

test("the action verb library is interactive and crawlable", () => {
  const html = fs.readFileSync(path.join(site, "resume-action-verbs.html"), "utf8");
  assert.ok(html.includes(`${siteUrl}/resume-action-verbs.html`), "verb guide missing canonical");
  assert.ok(html.includes("FAQPage"), "verb guide missing FAQ schema");
  assert.ok((html.match(/data-copy=/g) || []).length >= 100, "verb guide has too few copyable verbs");
  assert.ok(html.includes("before-after"), "verb guide missing before/after examples");
  assert.ok(html.includes("index.html#checker"), "verb guide missing scanner CTA");
});

test("summary examples are generated for every role", () => {
  const html = fs.readFileSync(path.join(site, "resume-summary-examples.html"), "utf8");
  assert.ok(html.includes(`${siteUrl}/resume-summary-examples.html`), "summary page missing canonical");
  assert.ok(html.includes("FAQPage"), "summary page missing FAQ schema");
  roles.forEach((role) => {
    assert.ok(html.includes(`id="${role.slug}"`), `summary page missing ${role.slug} anchor`);
    assert.ok(html.includes(`roles/${role.slug}.html`), `summary page missing ${role.slug} link`);
  });
  assert.ok((html.match(/summary-example/g) || []).length >= roles.length, "summary page is missing example blocks");
});

test("the guide hub links every free resource and roles include Web3", () => {
  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  ["free-ats-resume-checker.html", "sample-report.html", "ats-resume-format.html", "free-ats-resume-template.html", "resume-action-verbs.html", "resume-summary-examples.html", "resume-summary-generator.html", "keyword-extractor.html", "roles.html", "web3.html", "how-it-works.html"].forEach((href) => {
    assert.ok(guides.includes(`href="${href}"`), `guides hub missing ${href}`);
  });
  const rolesHtml = fs.readFileSync(path.join(site, "roles.html"), "utf8");
  ["smart-contract-engineer", "blockchain-developer", "defi-analyst", "web3-product-manager", "crypto-community-manager"].forEach((slug) => {
    assert.ok(rolesHtml.includes(`roles/${slug}.html`), `roles directory missing ${slug}`);
  });
});

test("new guides are styled, in the sitemap, and linked from the footer", () => {
  const css = fs.readFileSync(path.join(site, "assets/styles.css"), "utf8");
  [".template-block", ".before-after", ".ba-card", ".check-list", ".summary-example", ".guide-grid"].forEach((sel) => {
    assert.ok(css.includes(sel), `styles missing ${sel}`);
  });
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  ["guides.html", "free-ats-resume-checker.html", "sample-report.html", "ats-resume-format.html", "free-ats-resume-template.html", "resume-action-verbs.html", "resume-summary-examples.html", "resume-summary-generator.html"].forEach((page) => {
    assert.ok(sitemap.includes(`${siteUrl}/${page}`), `sitemap missing ${page}`);
  });
  ["index.html", "pricing.html", "how-it-works.html", "web3.html", "pay-with-usdc.html"].forEach((page) => {
    const html = fs.readFileSync(path.join(site, page), "utf8");
    ["free-ats-resume-checker.html", "ats-resume-format.html", "free-ats-resume-template.html", "resume-action-verbs.html", "resume-summary-examples.html", "resume-summary-generator.html", "guides.html", "sample-report.html"].forEach((href) => {
      assert.ok(html.includes(`href="${href}"`), `${page} footer missing ${href}`);
    });
  });
});

test("the summary generator is a local, working tool", () => {
  const html = fs.readFileSync(path.join(site, "resume-summary-generator.html"), "utf8");
  assert.ok(html.includes(`${siteUrl}/resume-summary-generator.html`), "generator missing canonical");
  assert.ok(html.includes("WebApplication"), "generator missing app schema");
  assert.ok(html.includes("FAQPage"), "generator missing FAQ schema");
  ["summary-form", "summary-role", "summary-years", "summary-skills", "summary-result", "summary-output", "data-summary-sample", "assets/summary.js"].forEach((needle) => {
    assert.ok(html.includes(needle), `generator missing ${needle}`);
  });
  const js = fs.readFileSync(path.join(site, "assets/summary.js"), "utf8");
  ["RR_ROLES", "buildVariants", "data-copy-summary", "navigator.clipboard", "prefers-reduced-motion"].forEach((needle) => {
    assert.ok(js.includes(needle), `summary.js missing ${needle}`);
  });
  assert.ok(!js.includes("fetch("), "summary generator should not make network requests");
});

test("the Jobscan comparison is fair, structured, and linked", () => {
  const file = path.join(site, "jobscan-alternative.html");
  assert.ok(fs.existsSync(file), "missing jobscan-alternative.html");
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes(`${siteUrl}/jobscan-alternative.html`), "comparison missing canonical");
  assert.ok(html.includes("Jobscan"), "comparison does not name Jobscan");
  assert.ok(html.includes("not affiliated"), "comparison missing the affiliation disclaimer");
  assert.ok(html.includes("trademark"), "comparison missing the trademark note");
  assert.ok(html.includes("FAQPage"), "comparison missing FAQ schema");
  assert.ok(html.includes("BreadcrumbList"), "comparison missing breadcrumb schema");
  assert.ok(html.includes("index.html#checker"), "comparison missing scanner CTA");
  assert.ok(html.includes("pricing.html"), "comparison missing Pro link");
  assert.ok(html.includes("LinkedIn"), "comparison missing the honest feature gap");

  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  assert.ok(guides.includes("jobscan-alternative.html"), "guide hub does not link the comparison");
  const checker = fs.readFileSync(path.join(site, "free-ats-resume-checker.html"), "utf8");
  assert.ok(checker.includes("jobscan-alternative.html"), "free checker does not link the comparison");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${siteUrl}/jobscan-alternative.html`), "sitemap missing the comparison");
});

test("the ATS score guide explains the bands honestly and is linked", () => {
  const file = path.join(site, "what-is-a-good-ats-score.html");
  assert.ok(fs.existsSync(file), "missing what-is-a-good-ats-score.html");
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes(`${siteUrl}/what-is-a-good-ats-score.html`), "score guide missing canonical");
  assert.ok(html.includes("Article"), "score guide missing Article schema");
  assert.ok(html.includes("FAQPage"), "score guide missing FAQ schema");
  assert.ok(html.includes("BreadcrumbList"), "score guide missing breadcrumb schema");
  assert.ok(html.includes("75 or higher"), "score guide missing the good-score target");
  assert.ok(html.includes("not a hiring prediction"), "score guide missing the honesty caveat");
  assert.ok(html.includes("index.html#checker"), "score guide missing scanner CTA");
  assert.ok(html.includes("sample-report.html"), "score guide missing sample report link");

  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  assert.ok(guides.includes("what-is-a-good-ats-score.html"), "guide hub does not link the score guide");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${siteUrl}/what-is-a-good-ats-score.html`), "sitemap missing the score guide");
});

test("the tailoring guide explains the process and is linked", () => {
  const file = path.join(site, "how-to-tailor-a-resume.html");
  assert.ok(fs.existsSync(file), "missing how-to-tailor-a-resume.html");
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes(`${siteUrl}/how-to-tailor-a-resume.html`), "tailoring guide missing canonical");
  assert.ok(html.includes("Article"), "tailoring guide missing Article schema");
  assert.ok(html.includes("FAQPage"), "tailoring guide missing FAQ schema");
  assert.ok(html.includes("BreadcrumbList"), "tailoring guide missing breadcrumb schema");
  assert.ok(html.includes("Step 1"), "tailoring guide missing the step-by-step process");
  assert.ok(html.includes("compare-before"), "tailoring guide missing the before/after example");
  assert.ok(html.includes("Posting requirement"), "tailoring guide missing the evidence worksheet");
  assert.ok(html.includes("index.html#checker"), "tailoring guide missing scanner CTA");

  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  assert.ok(guides.includes("how-to-tailor-a-resume.html"), "guide hub does not link the tailoring guide");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${siteUrl}/how-to-tailor-a-resume.html`), "sitemap missing the tailoring guide");
});

test("the no-interviews diagnostic guide is complete and linked", () => {
  const file = path.join(site, "why-am-i-not-getting-interviews.html");
  assert.ok(fs.existsSync(file), "missing why-am-i-not-getting-interviews.html");
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes(`${siteUrl}/why-am-i-not-getting-interviews.html`), "diagnostic guide missing canonical");
  assert.ok(html.includes("Article"), "diagnostic guide missing Article schema");
  assert.ok(html.includes("FAQPage"), "diagnostic guide missing FAQ schema");
  assert.ok(html.includes("BreadcrumbList"), "diagnostic guide missing breadcrumb schema");
  assert.ok(html.includes("copy-paste test"), "diagnostic guide missing the parser check");
  assert.ok(html.includes("15-minute triage"), "diagnostic guide missing the triage");
  assert.ok(html.includes("compare-before"), "diagnostic guide missing the before/after example");
  assert.ok(html.includes("index.html#checker"), "diagnostic guide missing scanner CTA");

  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  assert.ok(guides.includes("why-am-i-not-getting-interviews.html"), "guide hub does not link the diagnostic guide");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${siteUrl}/why-am-i-not-getting-interviews.html`), "sitemap missing the diagnostic guide");
});

test("the private no-upload checker page is complete and linked", () => {
  const file = path.join(site, "private-ats-resume-checker.html");
  assert.ok(fs.existsSync(file), "missing private-ats-resume-checker.html");
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes(`${siteUrl}/private-ats-resume-checker.html`), "private checker missing canonical");
  assert.ok(html.includes("Article"), "private checker missing Article schema");
  assert.ok(html.includes("FAQPage"), "private checker missing FAQ schema");
  assert.ok(html.includes("BreadcrumbList"), "private checker missing breadcrumb schema");
  assert.ok(html.includes("Network tab"), "private checker missing the verification steps");
  assert.ok(html.includes("no upload endpoint") || html.includes("No upload endpoint"), "private checker missing the no-upload claim");
  assert.ok(html.includes("index.html#checker"), "private checker missing scanner CTA");
  assert.ok(html.includes("privacy.html"), "private checker missing the privacy link");

  const guides = fs.readFileSync(path.join(site, "guides.html"), "utf8");
  assert.ok(guides.includes("private-ats-resume-checker.html"), "guide hub does not link the private checker");
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${siteUrl}/private-ats-resume-checker.html`), "sitemap missing the private checker");
});

test("the free checker landing page and sample report are complete and linked", () => {
  const checker = fs.readFileSync(path.join(site, "free-ats-resume-checker.html"), "utf8");
  assert.ok(checker.includes(`${siteUrl}/free-ats-resume-checker.html`), "free checker missing canonical");
  assert.ok(checker.includes("WebApplication"), "free checker missing app schema");
  assert.ok(checker.includes("FAQPage"), "free checker missing FAQ schema");
  assert.ok(checker.includes("index.html#checker"), "free checker missing scanner CTA");
  assert.ok(checker.includes("sample-report.html"), "free checker missing sample report link");
  assert.ok(checker.includes("no account"), "free checker missing the no-account claim");

  const sample = fs.readFileSync(path.join(site, "sample-report.html"), "utf8");
  assert.ok(sample.includes(`${siteUrl}/sample-report.html`), "sample report missing canonical");
  assert.ok(sample.includes("band-c"), "sample report missing the score band");
  assert.ok(sample.includes(">74<"), "sample report missing the example score");
  assert.ok(sample.includes("pricing.html"), "sample report missing the Pro link");
  assert.ok(sample.includes("fictional"), "sample report does not label the example as fictional");
  assert.ok(sample.includes("sev-critical"), "sample report missing a prioritized finding");

  const home = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.ok(home.includes("free-ats-resume-checker.html"), "homepage does not link the free checker page");
  assert.ok(home.includes("guides.html"), "homepage does not link the guide hub");
});

