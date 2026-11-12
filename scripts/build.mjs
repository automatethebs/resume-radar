#!/usr/bin/env node
/*
 * Builds the static SEO layer from site/assets/roles.js:
 *   - site/roles/<slug>.html  (24 role landing pages)
 *   - site/roles.html         (role directory)
 *   - site/sitemap.xml
 *   - site/robots.txt
 *
 * Usage: npm run build   (optionally SITE_URL=https://yourdomain.com npm run build)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "site");
const rolesDir = path.join(siteDir, "roles");
const require = createRequire(import.meta.url);
const { roles } = require(path.join(siteDir, "assets/roles.js"));

const configSrc = fs.readFileSync(path.join(siteDir, "assets/config.js"), "utf8");
const configSiteUrl = (configSrc.match(/siteUrl:\s*"([^"]+)"/) || [])[1] || "https://resumeradar.example";
const priceLabel = (configSrc.match(/priceLabel:\s*"([^"]+)"/) || [])[1] || "$9";
const siteUrl = (process.env.SITE_URL || configSiteUrl).replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  { title: "Technology & data", slugs: ["software-engineer", "data-analyst", "devops-engineer", "cybersecurity-analyst"] },
  { title: "Business & finance", slugs: ["product-manager", "project-manager", "business-analyst", "marketing-manager", "sales-representative", "accountant", "financial-analyst", "operations-manager", "human-resources", "supply-chain", "customer-service", "administrative-assistant"] },
  { title: "Healthcare & education", slugs: ["registered-nurse", "pharmacist", "teacher"] },
  { title: "Engineering & design", slugs: ["mechanical-engineer", "electrical-engineer", "civil-engineer", "graphic-designer", "ux-designer"] }
];

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nav(prefix, active) {
  const item = (href, label, key) =>
    `<a href="${prefix}${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${prefix}index.html" aria-label="ResumeRadar home">
        <img src="${prefix}assets/mark.svg" alt="" width="24" height="24">
        ResumeRadar
      </a>
      <nav class="nav" id="site-nav" aria-label="Main">
        ${item("index.html", "Checker", "checker")}
        ${item("roles.html", "Role guides", "roles")}
        ${item("how-it-works.html", "How it works", "how")}
        ${item("pricing.html", "Pricing", "pricing")}
      </nav>
      <span class="pro-chip">PRO</span>
      <a class="btn btn-sm btn-primary header-cta" href="${prefix}index.html#checker">Scan my resume</a>
      <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">☰</button>
    </div>
  </header>`;
}

function footer(prefix) {
  return `<footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="brand" href="${prefix}index.html"><img src="${prefix}assets/mark.svg" alt="" width="24" height="24">ResumeRadar</a>
          <p>A private ATS resume checker for people who would rather fix the resume than send another hundred applications into the void.</p>
        </div>
        <div class="footer-col">
          <h3>Product</h3>
          <a href="${prefix}index.html">ATS checker</a>
          <a href="${prefix}pricing.html">Pricing</a>
          <a href="${prefix}how-it-works.html">How it works</a>
          <a href="${prefix}roles.html">Role guides</a>
        </div>
        <div class="footer-col">
          <h3>Resources</h3>
          <a href="${prefix}roles/software-engineer.html">Software engineer keywords</a>
          <a href="${prefix}roles/registered-nurse.html">Nursing resume keywords</a>
          <a href="${prefix}roles/data-analyst.html">Data analyst keywords</a>
          <a href="${prefix}how-it-works.html#ats">ATS basics</a>
        </div>
        <div class="footer-col">
          <h3>Company</h3>
          <a href="https://github.com/automatethebs/resume-radar/issues" data-support>Support &amp; contact</a>
          <a href="${prefix}privacy.html">Privacy</a>
          <a href="${prefix}terms.html">Terms</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year>2026</span> ResumeRadar. Not affiliated with any ATS vendor.</span>
        <span>Built to be honest about what a score can and cannot predict.</span>
      </div>
    </div>
  </footer>`;
}

function scripts(prefix, withApp) {
  return `<script defer src="${prefix}assets/roles.js"></script>
  ${withApp ? `<script defer src="${prefix}assets/engine.js"></script>` : ""}
  <script defer src="${prefix}assets/config.js"></script>
  <script defer src="${prefix}assets/payments.js"></script>
  <script defer src="${prefix}assets/site.js"></script>
  ${withApp ? `<script defer src="${prefix}assets/app.js"></script>` : ""}`;
}

function shell({ title, description, canonical, prefix, body, jsonLd }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#191611">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/assets/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="${prefix}manifest.webmanifest">
  <link rel="stylesheet" href="${prefix}assets/styles.css">
  ${scripts(prefix, false)}
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
</head>
<body>
  ${nav(prefix, "roles")}
  ${body}
  ${footer(prefix)}
</body>
</html>`;
}

function chips(terms) {
  return terms.map((t) => `<button type="button" class="chip" data-copy="${esc(t)}" title="Click to copy"><span class="dot"></span>${esc(t)}</button>`).join("");
}

function rolePage(role) {
  const others = roles.filter((r) => r.slug !== role.slug).slice(0, 8);
  const keywords = role.core.length + role.tools.length;
  const title = `ATS Resume Checker for ${role.plural} — Free Keyword List`;
  const description = `Free ATS resume checker for ${role.plural}. Score your resume, find missing ${role.title} keywords, and fix parsing issues in 20 seconds. No signup, 100% private.`;
  const canonical = `${siteUrl}/roles/${role.slug}.html`;

  const faq = [
    {
      q: `What keywords should a ${role.title} resume include?`,
      a: `Start with the core skills hiring managers scan for: ${role.core.slice(0, 6).join(", ")}. Then add the tools you actually use, such as ${role.tools.slice(0, 5).join(", ")}. Mirror the exact wording of each job posting where it is truthful — a synonym can miss a keyword filter.`
    },
    {
      q: `How do I get a ${role.title} resume past an ATS?`,
      a: `Use a single-column layout, plain text headings, month-and-year date ranges, and a dedicated skills section. Put the posting's most important terms inside experience bullets, not only in a list. Quantify outcomes, keep the file to one or two pages, and submit a PDF or DOCX that preserves selectable text.`
    },
    {
      q: `Is this ${role.title} resume checker free?`,
      a: `Yes. The score, category breakdown, top five missing keywords, and top fixes are free with no account. Pro is a one-time ${priceLabel} upgrade that reveals every missing keyword, the full ${keywords}-term role checklist, all fixes, and a text export.`
    }
  ];

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Role guides", "item": `${siteUrl}/roles.html` },
          { "@type": "ListItem", "position": 3, "name": role.title, "item": canonical }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": faq.map((item) => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a }
        }))
      }
    ]
  });

  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a><span>/</span><a href="../roles.html">Role guides</a><span>/</span>${esc(role.title)}
      </nav>
    </div>

    <section class="role-hero">
      <div class="wrap">
        <p class="eyebrow">${esc(role.title)} · ATS keyword guide</p>
        <h1>ATS Resume Checker for ${esc(role.plural)}</h1>
        <p class="lede">Most ${esc(role.title)} applications are filtered before a recruiter reads them. Paste your resume and a real job post to see how your keywords, structure, and impact compare — then fix the gaps that matter. Built around ${esc(role.focus)}.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="../index.html?role=${role.slug}#checker">Scan my ${esc(role.title)} resume</a>
          <a class="btn btn-ghost btn-lg" href="../roles.html">Browse all role guides</a>
        </div>
        <p class="role-note">Free · no account · your resume stays in your browser</p>
      </div>
    </section>

    <section class="section-tight" aria-labelledby="kw-heading">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">The vocabulary</p>
          <h2 id="kw-heading">${keywords} keywords for a ${esc(role.title)} resume</h2>
          <p>Click any term to copy it. Use only what is true and relevant to the posting — keyword stuffing is easy for a human to spot and hard to defend in an interview.</p>
        </div>
        <div class="kw-groups">
          <div class="kw-group">
            <h2>Core skills</h2>
            <div class="chips">${chips(role.core)}</div>
          </div>
          <div class="kw-group">
            <h2>Tools &amp; platforms</h2>
            <div class="chips">${chips(role.tools)}</div>
          </div>
          <div class="kw-group">
            <h2>Action verbs</h2>
            <div class="chips">${chips(role.verbs)}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap role-body">
        <div class="prose">
          <h2>What an ATS looks for in a ${esc(role.title)} resume</h2>
          <p>Most applicant tracking systems reduce your resume to structured fields: contact details, job titles, employers, dates, skills, and education. For ${esc(role.plural)}, the searchable layer is dominated by ${esc(role.core.slice(0, 4).join(", "))}. If those ideas appear only in a graphic, a table, or an image-based PDF, the parser may never see them.</p>
          <ul>
            <li><strong>Exact vocabulary.</strong> If the posting says “${esc(role.core[0])}”, use that phrase rather than a clever variation. The checker treats common synonyms as partial matches, but recruiters search literal terms.</li>
            <li><strong>Evidence, not adjectives.</strong> “Strong ${esc(role.core[1] || "communication")} skills” is claimed by everyone. A bullet with a number, a scope, and an outcome is believed.</li>
            <li><strong>Tools in context.</strong> List ${esc(role.tools.slice(0, 3).join(", "))} in your skills block, then show where you used them inside a role. The combination is what survives both the parser and the skim.</li>
          </ul>

          <h2>How to use these keywords honestly</h2>
          <p>Pick the 8–12 terms that genuinely describe your last few years. Put the most important ones in your summary and your most recent role, because that is where both parsers and humans spend the most attention. If a required tool is missing, do not invent it — either close the gap with a small project or apply to roles where it is a nice-to-have rather than a hard filter.</p>

          <h2>How the score is calculated</h2>
          <p>ResumeRadar weights four things: keyword match (40%), parser-safe structure (20%), measurable impact (25%), and readability (15%). The keyword score blends the job description you paste with the ${keywords}-term ${esc(role.title)} checklist above. Nothing is randomised; every lost point comes with a visible reason and a suggested fix.</p>

          <h2>Common ${esc(role.title)} resume mistakes</h2>
          <ul>
            <li><strong>A skills list with no proof.</strong> Naming ${esc(role.tools[0])} and ${esc(role.tools[1] || role.core[0])} is not the same as showing what you built, analysed, or improved with them.</li>
            <li><strong>Duties instead of outcomes.</strong> “Responsible for ${esc(role.core[2] || role.core[0])}” describes a job description, not a person. Start with a verb and end with a result.</li>
            <li><strong>One resume for every posting.</strong> The highest-leverage edit is matching the top five terms of each posting. It takes four minutes and changes the filter result.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside>
          <div class="aside-card">
            <p class="eyebrow" style="color:#e9a27c">Free scan</p>
            <h3>Check your resume against a real ${esc(role.title)} job.</h3>
            <p>20 seconds. No account. Nothing uploaded. Get your score and the first five fixes free.</p>
            <a class="btn btn-block" href="../index.html?role=${role.slug}#checker">Scan my resume</a>
            <div class="aside-list">
              <span>${keywords} ${esc(role.title)} keywords built in</span>
              <span>Parser and impact checks</span>
              <span>Pro unlocks every gap</span>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Keep going</p>
          <h2>Other role guides</h2>
        </div>
        <div class="role-links">
          ${others.map((r) => `<a href="${r.slug}.html">${esc(r.title)}</a>`).join("")}
        </div>
        <p class="small" style="margin-top:16px"><a class="link-arrow" href="../roles.html">See all 24 role guides →</a></p>
      </div>
    </section>
  </main>`;

  return shell({ title, description, canonical, prefix: "../", body, jsonLd });
}

function rolesIndexPage() {
  const title = "ATS Resume Guides for 24 Roles — Free Keyword Lists";
  const description = "Browse free ATS resume keyword guides for software engineers, nurses, teachers, analysts, designers, accountants, and more. Copy the keywords, then score your resume.";
  const canonical = `${siteUrl}/roles.html`;
  const body = `<main>
    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Role guides</p>
        <h1>The words your next employer is searching for.</h1>
        <p class="lede">Every field has its own vocabulary. Pick your role to see the core skills, tools, and action verbs that show up in real postings — then run your resume through the free ATS checker.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan my resume</a>
          <a class="btn btn-ghost btn-lg" href="pricing.html">See Pro</a>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        ${CATEGORIES.map((cat) => {
          const items = cat.slugs.map((slug) => roles.find((r) => r.slug === slug)).filter(Boolean);
          return `<section class="role-section" aria-labelledby="cat-${cat.slugs[0]}">
            <div class="section-head" style="margin-bottom:18px">
              <p class="eyebrow">${esc(cat.title)}</p>
              <h2 id="cat-${cat.slugs[0]}" style="font-size:1.6rem">${esc(cat.title)} resumes</h2>
            </div>
            <div class="role-cards">
              ${items.map((r) => `<a class="role-card" href="roles/${r.slug}.html"><strong>${esc(r.title)}</strong><span>${esc(r.focus)}</span></a>`).join("")}
            </div>
          </section>`;
        }).join("")}
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Four minutes of tailoring beats another hundred applications.</h2>
            <p>Paste your resume and the job post. Get the score, the gaps, and the fixes.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body });
}

function sitemap() {
  const urls = [
    { loc: `${siteUrl}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${siteUrl}/roles.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/pricing.html`, priority: "0.7", changefreq: "monthly" },
    { loc: `${siteUrl}/how-it-works.html`, priority: "0.6", changefreq: "monthly" },
    { loc: `${siteUrl}/privacy.html`, priority: "0.3", changefreq: "yearly" },
    { loc: `${siteUrl}/terms.html`, priority: "0.3", changefreq: "yearly" },
    ...roles.map((r) => ({ loc: `${siteUrl}/roles/${r.slug}.html`, priority: "0.7", changefreq: "monthly" }))
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

// --- write -----------------------------------------------------------------
fs.mkdirSync(rolesDir, { recursive: true });
for (const file of fs.readdirSync(rolesDir)) {
  if (file.endsWith(".html")) fs.unlinkSync(path.join(rolesDir, file));
}

for (const role of roles) {
  fs.writeFileSync(path.join(rolesDir, `${role.slug}.html`), rolePage(role));
}
fs.writeFileSync(path.join(siteDir, "roles.html"), rolesIndexPage());
fs.writeFileSync(path.join(siteDir, "sitemap.xml"), sitemap());
fs.writeFileSync(
  path.join(siteDir, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
);

console.log(`Built ${roles.length} role pages + roles.html + sitemap.xml + robots.txt`);
console.log(`Canonical base: ${siteUrl}`);
console.log(`Pro price: ${priceLabel}`);
if (siteUrl.includes("resumeradar.example")) {
  console.log("\nNOTE: siteUrl is still the placeholder. Set it in site/assets/config.js or run:");
  console.log("      SITE_URL=https://yourdomain.com npm run build");
}
