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
  { title: "Engineering & design", slugs: ["mechanical-engineer", "electrical-engineer", "civil-engineer", "graphic-designer", "ux-designer"] },
  { title: "Crypto & Web3", slugs: ["smart-contract-engineer", "blockchain-developer", "defi-analyst", "web3-product-manager", "crypto-community-manager"] }
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
        ${item("keyword-extractor.html", "Keywords", "keywords")}
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
          <a href="${prefix}keyword-extractor.html">Job keyword extractor</a>
          <a href="${prefix}free-ats-resume-checker.html">Free ATS resume checker</a>
          <a href="${prefix}jobscan-alternative.html">Jobscan alternative</a>
          <a href="${prefix}ats-resume-format.html">ATS resume format</a>
          <a href="${prefix}free-ats-resume-template.html">Free ATS template</a>
          <a href="${prefix}resume-action-verbs.html">Resume action verbs</a>
          <a href="${prefix}resume-summary-examples.html">Resume summary examples</a>
          <a href="${prefix}resume-summary-generator.html">Summary generator</a>
          <a href="${prefix}guides.html">All resume guides</a>
          <a href="${prefix}sample-report.html">Sample ATS report</a>
          <a href="${prefix}web3.html">Crypto &amp; Web3 resumes</a>
          <a href="${prefix}pay-with-usdc.html">How to pay with USDC</a>
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
        <p class="small" style="margin-top:16px"><a class="link-arrow" href="../roles.html">See all 29 role guides →</a></p>
      </div>
    </section>
  </main>`;

  return shell({ title, description, canonical, prefix: "../", body, jsonLd });
}

function rolesIndexPage() {
  const title = "ATS Resume Guides for 29 Roles — Free Keyword Lists";
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

function freeAtsCheckerPage() {
  const title = "Free ATS Resume Checker — No Signup, No Upload | ResumeRadar";
  const description = "Check your resume against any job description in 20 seconds. Free ATS score, missing keywords, parser warnings, and prioritized fixes. No account and no upload.";
  const canonical = `${siteUrl}/free-ats-resume-checker.html`;
  const faq = [
    {
      q: "Is this ATS resume checker really free?",
      a: "Yes. The score, category breakdown, top five missing keywords, and top four fixes are free with no account. Pro is an optional one-time upgrade that reveals every missing term, the complete role checklist, all fixes, and a text export."
    },
    {
      q: "Do I have to upload my resume?",
      a: "No. Paste the plain text and the scan runs in your browser. There is no upload endpoint, no account, and no resume storage. The only thing saved locally is your Pro unlock state if you buy it."
    },
    {
      q: "How accurate is an ATS resume checker?",
      a: "It can measure keyword coverage, parser-safe structure, measurable impact, and readability against a specific posting. It cannot reproduce every employer's ATS configuration or predict whether a recruiter will advance you. Treat the score as a prioritized editing list, not a hiring prediction."
    },
    {
      q: "Does it work without a job description?",
      a: "Yes. You can scan against one of 29 built-in role checklists. Adding a real posting makes the result more specific because the keyword match is built from the employer's language."
    },
    {
      q: "What is the difference between the free scan and Pro?",
      a: "The free scan shows the top five missing keywords and top four fixes. Pro shows every missing keyword ranked by importance, the full role checklist, every recommended fix, a cover-letter outline, interview questions, and a downloadable text report."
    },
    {
      q: "Is ResumeRadar a Jobscan alternative?",
      a: "It is a lighter alternative for one job: checking a resume against a specific posting. Jobscan is a broader paid platform with LinkedIn optimization and other career tools. ResumeRadar is free to scan, $9 once for Pro, and does not require an account or resume upload. Use whichever fits the task you need done."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "ResumeRadar Free ATS Resume Checker",
        "url": canonical,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "description": description
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
    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Free ATS checker · No signup</p>
        <h1>Free ATS resume checker. No signup. No upload.</h1>
        <p class="lede">Paste your resume and a real job post. In about 20 seconds you get a 0–100 match score, the keywords a recruiter will search for, the parser issues that hide your experience, and the fixes that matter first.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-lg" href="sample-report.html">See a sample report</a>
        </div>
        <p class="role-note">Free forever · no account · your resume stays in this browser tab</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">What you get</p>
          <h2>Four checks that change what you edit.</h2>
          <p>No black-box “AI score”. Every point is attached to a visible reason and a specific fix.</p>
        </div>
        <div class="feature-grid">
          <article class="feature"><span class="glyph">01 / KEYWORDS</span><h3>Missing keyword map</h3><p>Extracts the terms the posting emphasises, credits synonyms and short forms, and ranks the gaps by importance.</p></article>
          <article class="feature"><span class="glyph">02 / PARSING</span><h3>Parser-safe structure</h3><p>Checks contact details, headings, dates, skills blocks, and length — the fields an ATS reconstructs first.</p></article>
          <article class="feature"><span class="glyph">03 / IMPACT</span><h3>Evidence of results</h3><p>Counts bullets with numbers, percentages, and money, and flags weak phrasing such as “responsible for”.</p></article>
          <article class="feature"><span class="glyph">04 / READABILITY</span><h3>Human skim check</h3><p>Flags walls of text, bloated bullets, and vague language that survives the parser but loses the recruiter.</p></article>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>How the free scan works</h2>
          <ol>
            <li><strong>Paste your resume as plain text.</strong> Include the contact line, section headings, dates, and bullets. No file upload is needed.</li>
            <li><strong>Paste the job description.</strong> Optional, but this is what turns a generic checklist into a match score for the actual role.</li>
            <li><strong>Read the ranked fixes.</strong> Add only what is true. Re-scan after each edit and watch the score move.</li>
          </ol>

          <h2>Why there is no signup</h2>
          <p>Most resume scanners want an account so they can store your document, email you, and sell a subscription. ResumeRadar does not need any of that. The scoring engine is a local JavaScript file; the site has no server-side resume endpoint. There is no account to create and no resume to delete.</p>
          <p>The trade-off is honest: the free scan shows the first five missing keywords and four fixes. If you want the complete list, Pro is a one-time $9 unlock. You are paying for the rules and the report, not for infrastructure.</p>

          <h2>ResumeRadar vs a typical paid scanner</h2>
          <table class="score-table">
            <thead><tr><th>Check</th><th>Typical paid scanner</th><th>ResumeRadar</th></tr></thead>
            <tbody>
              <tr><td>Free score</td><td>Sometimes, often gated</td><td>Yes, full category breakdown</td></tr>
              <tr><td>Account required</td><td>Usually</td><td>No</td></tr>
              <tr><td>Resume upload</td><td>Usually</td><td>No — local text only</td></tr>
              <tr><td>Keyword gaps</td><td>Paid plan</td><td>Top five free, all in Pro</td></tr>
              <tr><td>Parser warnings</td><td>Varies</td><td>Free</td></tr>
              <tr><td>Price</td><td>Monthly subscription</td><td>$0 scan; $9 once for Pro</td></tr>
            </tbody>
          </table>
          <p><a href="jobscan-alternative.html">See the detailed ResumeRadar vs Jobscan comparison</a> for a fair look at when a broader, account-based platform is the better fit.</p>

          <h2>Who it is for</h2>
          <p>Anyone applying through a company portal: software engineers, nurses, teachers, analysts, designers, accountants, operations managers, and the 29 role guides on this site. It is also useful for career changers who need to see which language from the new field is missing from an old resume.</p>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Before you scan</h3>
          <ul class="check-list">
            <li>Plain text, not an image</li>
            <li>Contact details in the body</li>
            <li>Standard section headings</li>
            <li>Month + year dates</li>
            <li>At least 25 words</li>
          </ul>
          <a class="btn btn-primary btn-block" href="index.html#checker">Check my resume</a>
          <a class="btn btn-ghost btn-block" href="free-ats-resume-template.html" style="margin-top:8px">Get the free template</a>
          <p class="small muted" style="margin-top:10px">No account. Nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>See your resume the way the filter sees it.</h2>
            <p>20 seconds. Free. Private. Then fix the first four gaps.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function jobscanAlternativePage() {
  const title = "Free Jobscan Alternative — No Signup, $9 One-Time Pro | ResumeRadar";
  const description = "An honest comparison of ResumeRadar and Jobscan: a private, no-signup ATS scan with a $9 one-time Pro report versus an account-based job-search platform. See which fits your task.";
  const canonical = `${siteUrl}/jobscan-alternative.html`;
  const faq = [
    {
      q: "Is ResumeRadar really a Jobscan alternative?",
      a: "For one task, yes: checking a resume against a specific job posting. ResumeRadar gives you a score, missing keywords, parser warnings, and fixes without an account or resume upload. Jobscan is the better fit if you want a broader job-search platform with LinkedIn optimization, job tracking, and a browser extension."
    },
    {
      q: "What does ResumeRadar cost?",
      a: "The scan is free. Pro is a one-time $9 unlock, not a subscription. It reveals every missing keyword, the full role checklist, all recommended fixes, a cover-letter outline, interview questions, and a text export."
    },
    {
      q: "Does ResumeRadar upload my resume?",
      a: "No. The scoring engine is local JavaScript. Paste plain text and the scan runs in your browser; there is no resume upload endpoint and no server-side storage. Only your Pro unlock state is kept in local storage if you buy it."
    },
    {
      q: "Does Jobscan require an account?",
      a: "Jobscan is an account-based service with limited free scanning and paid subscription plans. Check Jobscan's site for its current free limits, features, and prices, since those change."
    },
    {
      q: "Which one should I use?",
      a: "Use ResumeRadar if you want a fast, private, low-cost check for one posting, especially in a technical or Web3 role. Use Jobscan if you want an established platform that also optimizes LinkedIn, tracks applications, and bundles several job-search tools."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Jobscan alternative", "item": canonical }
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
        <a href="index.html">Home</a><span>/</span>Jobscan alternative
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Honest comparison</p>
        <h1>A lighter Jobscan alternative for one ATS check.</h1>
        <p class="lede">Jobscan is a mature job-search platform. ResumeRadar does one job: it scores your resume against a specific posting, shows the keyword gaps, and explains the fixes — without an account, an upload, or a subscription.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-lg" href="sample-report.html">See a sample report</a>
        </div>
        <p class="role-note">Free scan · $9 once for Pro · no account · resume stays in the browser</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>The short version</h2>
          <p>If you want the broadest job-search toolkit, Jobscan is the more complete product. It offers resume scanning, LinkedIn optimization, job tracking, and a browser extension on account-based plans. If you want a private, inexpensive check for the posting in front of you, ResumeRadar is deliberately smaller and faster.</p>

          <table class="score-table">
            <thead><tr><th>What matters</th><th>ResumeRadar</th><th>Jobscan</th></tr></thead>
            <tbody>
              <tr><td>Free ATS scan</td><td>Yes, with the full category breakdown</td><td>Limited free scans; account required</td></tr>
              <tr><td>Account required</td><td>No</td><td>Yes</td></tr>
              <tr><td>Resume handling</td><td>Stays in your browser; no upload endpoint</td><td>Uploaded for cloud processing</td></tr>
              <tr><td>Price model</td><td>$0 scan; $9 one-time Pro</td><td>Subscription plans; check current pricing</td></tr>
              <tr><td>LinkedIn optimization</td><td>Not offered</td><td>Yes</td></tr>
              <tr><td>Job tracking &amp; extension</td><td>Not offered</td><td>Yes</td></tr>
              <tr><td>Role-specific keyword lists</td><td>29 free role guides, including 5 Web3 roles</td><td>Broader general job-search content</td></tr>
              <tr><td>Best for</td><td>One private, low-cost ATS check</td><td>A full, account-based job-search workflow</td></tr>
            </tbody>
          </table>

          <h2>When Jobscan is the better choice</h2>
          <p>Choose Jobscan if you are running a full job search and want one dashboard for resume scans, LinkedIn optimization, application tracking, and a browser extension. It is also the safer choice if you want an established brand with a broad feature set and do not mind a subscription.</p>

          <h2>When ResumeRadar is the better choice</h2>
          <p>Choose ResumeRadar if you have one posting to tailor for, you do not want to create another account, or you would rather not upload your resume to a third-party service. It is also a practical fit for technical and Web3 roles, where the keyword lists are specific and the $9 one-time price is easy to justify.</p>

          <h2>What the free scan actually shows</h2>
          <p>The free report gives you a 0–100 score, four category scores, the top five missing keywords, parser warnings, and the first four fixes. Pro adds every missing keyword ranked by importance, the complete role checklist, every fix, a cover-letter outline, eight interview questions, and a downloadable text report. There is no subscription and no recurring charge.</p>

          <h2>How the comparison was made</h2>
          <p>This page compares the products on the tasks ResumeRadar is built for. Jobscan's features and prices are set by Jobscan and can change; verify them on Jobscan's site before buying. ResumeRadar is not affiliated with, endorsed by, or sponsored by Jobscan. Jobscan is a trademark of its owner.</p>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Try the free scan</h3>
          <p class="small muted">Paste your resume and a real posting. No account. Nothing uploaded.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Check my resume</a>
          <a class="btn btn-ghost btn-block" href="pricing.html" style="margin-top:8px">See the $9 Pro report</a>
          <p class="small muted" style="margin-top:10px">One-time payment. No subscription.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Check the posting in front of you.</h2>
            <p>20 seconds. Free. Private. Then fix the first four gaps.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function sampleReportPage() {
  const title = "Sample ATS Resume Report — Score, Keywords, and Fixes";
  const description = "See a complete example ResumeRadar report: a 74/100 score, category breakdown, matched and missing keywords, parser warnings, and prioritized fixes.";
  const canonical = `${siteUrl}/sample-report.html`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "author": { "@type": "Organization", "name": "ResumeRadar" },
    "publisher": { "@type": "Organization", "name": "ResumeRadar" },
    "dateModified": today,
    "mainEntityOfPage": canonical
  });
  const body = `<main>
    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Sample report</p>
        <h1>What a real scan looks like.</h1>
        <p class="lede">This is an illustrative report for a fictional software engineer applying to a platform role. The score is not a hiring prediction; it is a prioritized editing list. Your own report is generated from your text in the browser.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-lg" href="pricing.html">See Pro</a>
        </div>
        <p class="role-note">Illustrative example · names, numbers, and the job post are fictional</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="report-grid">
          <aside class="card score-card band-c">
            <div class="score-top">
              <div class="score-ring" style="--pct:74" role="img" aria-label="Example ATS readiness score 74 out of 100">
                <div style="text-align:center"><div class="score-num">74</div><div class="score-den">/ 100</div></div>
              </div>
              <div class="score-meta">
                <div class="grade-badge" aria-label="Grade C">C</div>
                <h2>Promising, with fixable gaps</h2>
                <p>Target: Software Engineer · example scan</p>
              </div>
            </div>
            <p class="score-summary">The experience is relevant, but the posting's infrastructure vocabulary is under-represented and two bullets describe duties instead of outcomes. The structure parses cleanly.</p>
            <div class="category-list">
              <div class="category"><div class="category-top"><span class="cat-label">Keyword match</span><span class="cat-score">62</span></div><div class="bar"><i style="width:62%"></i></div><span class="cat-note">Several required tools appear only in the skills list.</span></div>
              <div class="category"><div class="category-top"><span class="cat-label">Parser-safe structure</span><span class="cat-score">88</span></div><div class="bar"><i style="width:88%"></i></div><span class="cat-note">Single column, standard headings, readable dates.</span></div>
              <div class="category"><div class="category-top"><span class="cat-label">Measurable impact</span><span class="cat-score">71</span></div><div class="bar"><i style="width:71%"></i></div><span class="cat-note">Six of nine bullets include a number or scope.</span></div>
              <div class="category"><div class="category-top"><span class="cat-label">Readability</span><span class="cat-score">82</span></div><div class="bar"><i style="width:82%"></i></div><span class="cat-note">Bullets are short enough to skim.</span></div>
            </div>
            <div class="score-foot"><span>612 words · 18 bullets</span><span class="grade-key">A 85+ · B 75+ · C 65+</span></div>
          </aside>

          <div class="report-main">
            <section class="card">
              <div class="block-head"><h3>Keyword match</h3><span class="tiny mono muted">40% of score</span></div>
              <div class="kw-summary"><span class="kw-stat"><strong>62%</strong> job keyword match</span><span class="kw-stat"><strong>71%</strong> role checklist</span><span class="kw-stat"><strong>17</strong> of 27 terms found</span></div>
              <div class="block-head" style="margin-top:8px"><h3 style="font-size:.92rem">Found in the example resume</h3></div>
              <div class="chips">
                <span class="chip matched"><span class="dot"></span>javascript <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>typescript <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>react <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>node.js <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>postgresql <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>rest apis <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>docker <span class="tick">✓</span></span>
                <span class="chip matched"><span class="dot"></span>aws <span class="tick">✓</span></span>
              </div>
              <div class="block-head" style="margin-top:20px"><h3 style="font-size:.92rem">Missing or weak terms</h3><span class="tiny muted">Ranked by importance</span></div>
              <div class="chips">
                <span class="chip" data-weight="high"><span class="dot"></span>kubernetes</span>
                <span class="chip" data-weight="high"><span class="dot"></span>terraform</span>
                <span class="chip" data-weight="high"><span class="dot"></span>observability</span>
                <span class="chip" data-weight="medium"><span class="dot"></span>incident response</span>
                <span class="chip" data-weight="medium"><span class="dot"></span>ci/cd</span>
              </div>
              <div class="lock-card" style="margin-top:14px">
                <div class="lock-icon" aria-hidden="true">🔒</div>
                <div class="lock-copy"><strong>5 more terms are in the full report</strong><span>Pro shows every gap, ranked by importance, plus the complete role checklist.</span></div>
                <a class="btn btn-sm btn-primary" href="pricing.html">Unlock $9</a>
              </div>
              <p class="kw-hint">ATS filters look for the posting's language. Add terms only where they are true — never stuff a hidden keyword list.</p>
            </section>

            <section class="card">
              <div class="block-head"><h3>What to fix first</h3><span class="tiny mono muted">3 issues</span></div>
              <div class="findings">
                <article class="finding sev-critical"><span class="finding-icon" aria-hidden="true">!</span><div><h4>Kubernetes is required but only implied</h4><p>The posting names Kubernetes in the responsibilities; the resume mentions “container orchestration” without the exact term.</p><p class="fix"><b>Fix:</b> If true, add “Kubernetes” to the platform migration bullet and the skills line.</p></div></article>
                <article class="finding sev-warning"><span class="finding-icon" aria-hidden="true">△</span><div><h4>Two bullets describe duties, not results</h4><p>“Responsible for maintaining the API” and “Worked on CI/CD” describe the job description, not your contribution.</p><p class="fix"><b>Fix:</b> Replace each with a verb, a scope, and a measurable outcome.</p></div></article>
                <article class="finding sev-good"><span class="finding-icon" aria-hidden="true">✓</span><div><h4>Contact details and dates parse cleanly</h4><p>Name, email, phone, city, and month-year ranges are in the body of the resume.</p><p class="fix"><b>Fix:</b> No change needed. Keep the same structure when you tailor.</p></div></article>
              </div>
            </section>

            <section class="card">
              <div class="block-head"><h3>Pro playbook</h3><span class="tiny mono muted">Included with Pro</span></div>
              <div class="playbook-grid">
                <div class="playbook-panel"><h4>Cover letter outline</h4><div class="cover-letter"><p><strong>Paragraph 1.</strong> Name the role and the strongest matching result.</p><p><strong>Paragraph 2.</strong> Connect one example to the posting's top requirement.</p><p><strong>Paragraph 3.</strong> Close with a specific reason for this company.</p></div></div>
                <div class="playbook-panel"><h4>Interview questions</h4><ul class="interview-list"><li>Walk me through the Kubernetes migration.</li><li>How did you measure the 34% load-time improvement?</li><li>Describe an incident you diagnosed end to end.</li></ul></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div><h2>Run the same report on your resume.</h2><p>Free scan, no account, no upload. The first fixes are visible immediately.</p></div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function summaryGeneratorPage() {
  const title = "Free Resume Summary Generator — 3 Variants in Seconds";
  const description = "Generate three resume summary variants from your role, years of experience, skills, and one measurable result. Free, private, and no signup.";
  const canonical = `${siteUrl}/resume-summary-generator.html`;
  const faq = [
    {
      q: "Is the summary generator free?",
      a: "Yes. It runs in your browser with no account and no email gate. The optional Pro report is a separate $9 upgrade; the generator and the summaries it produces are free."
    },
    {
      q: "Does the generator use AI?",
      a: "No. It uses deterministic templates built from the role vocabulary in the 29 role guides. That means the output is predictable and private, but you still need to add your own true evidence. It will not invent experience for you."
    },
    {
      q: "How do I make the summary sound less generic?",
      a: "Replace the bracketed result with a real number and scope, then cut any skill you would not want to be interviewed on. The strongest summary is one specific sentence about a result, not a list of adjectives."
    },
    {
      q: "Should I use one summary for every application?",
      a: "Change at least the first sentence. Mirror the job title and the top two or three requirements from the posting. The rest of the summary can stay stable if it is accurate."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "ResumeRadar Resume Summary Generator",
        "url": canonical,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "description": description
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
    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Free summary generator</p>
        <h1>Three resume summaries. One true result.</h1>
        <p class="lede">Pick a role, add your years, skills, and one measurable outcome. The generator writes three editable variants using the same vocabulary as the role guides. No account, no AI API, nothing uploaded.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-lg" href="resume-summary-examples.html">See 29 examples</a>
        </div>
      </div>
    </section>

    <section class="page-body">
      <div class="wrap">
        <div class="generator-grid">
          <div class="generator-card">
            <h2 style="font-size:1.15rem">Build your summary</h2>
            <p class="small muted" style="margin:8px 0 18px">The output is a scaffold. Replace every bracket with something true.</p>
            <form class="generator-form" id="summary-form">
              <div>
                <label for="summary-role">Target role</label>
                <select id="summary-role" name="role"></select>
              </div>
              <div>
                <label for="summary-years">Years of experience</label>
                <input id="summary-years" name="years" type="number" min="0" max="40" step="1" value="5" inputmode="numeric">
              </div>
              <div>
                <label for="summary-skills">Three relevant skills</label>
                <input id="summary-skills" name="skills" type="text" placeholder="TypeScript, React, Node.js" autocomplete="off">
                <p class="field-hint">Comma-separated. Use the terms from the posting where they are true.</p>
              </div>
              <div>
                <label for="summary-result">One measurable result</label>
                <input id="summary-result" name="result" type="text" placeholder="cut deploy time from 45 to 8 minutes" autocomplete="off">
                <p class="field-hint">A number, a scope, or a before/after is enough.</p>
              </div>
              <button class="btn btn-primary" type="submit">Generate 3 summaries</button>
              <button class="btn btn-ghost" type="button" data-summary-sample>Try a sample</button>
              <p class="tiny muted">Runs locally. Your text is not sent anywhere.</p>
            </form>
          </div>

          <div class="generator-card">
            <p class="eyebrow">The formula</p>
            <h2 style="font-size:1.15rem">Who you are. What changed. What is next.</h2>
            <ul class="check-list" style="color:var(--muted)">
              <li><strong style="color:var(--ink)">Who:</strong> role, years, and three relevant skills.</li>
              <li><strong style="color:var(--ink)">Proof:</strong> one result with a number or clear scope.</li>
              <li><strong style="color:var(--ink)">Direction:</strong> the problem you want to work on next.</li>
            </ul>
            <p class="small muted" style="margin-top:16px">Keep it to 40–70 words. Write it after your experience bullets, so the proof is already on the page. Never claim a skill you cannot defend in an interview.</p>
            <a class="btn btn-ghost btn-block" href="ats-resume-format.html" style="margin-top:16px">Read the format guide</a>
          </div>
        </div>

        <div class="generator-output" id="summary-output" hidden aria-live="polite">
          <div class="section-head" style="margin-bottom:0">
            <p class="eyebrow">Your drafts</p>
            <h2 style="font-size:1.5rem">Copy the one that sounds like you.</h2>
            <p class="small muted">Then replace the bracketed result and cut anything you cannot defend.</p>
          </div>
        </div>

        <div class="prose" style="margin-top:44px">
          <h2>Why a summary is not an objective statement</h2>
          <p>“Seeking a challenging role where I can grow” describes what you want from an employer. A summary should describe what an employer gets. Lead with the role and the evidence, not with a wish. The generator uses the same role vocabulary as the 29 keyword guides because that is the language both a parser and a recruiter are scanning for.</p>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Now check the summary against a real posting.</h2>
            <p>Paste the resume and the job description. Get the score, the gaps, and the fixes.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>
  <script defer src="assets/summary.js"></script>`;

  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function summaryExamplesPage() {
  const title = "Resume Summary Examples for 29 Roles (2026) — Free Templates";
  const description = "Role-specific resume summary examples for 29 jobs, plus a three-sentence formula you can adapt. Free, no signup, with links to each ATS keyword guide.";
  const canonical = `${siteUrl}/resume-summary-examples.html`;

  const faq = [
    {
      q: "How long should a resume summary be?",
      a: "Two to four sentences. One sentence for your role and years of experience, one or two for proof, and one for what you want next. A summary that runs past five lines is usually hiding a cover letter."
    },
    {
      q: "Should I include a summary if I have little experience?",
      a: "Yes, if you have something concrete to say. For early-career candidates, lead with education, projects, or a measurable result instead of claiming years you do not have. Skip the summary entirely if it would only repeat your headline."
    },
    {
      q: "Do I need a different summary for every job?",
      a: "Not every word, but the first sentence should change. Mirror the title and the top two or three requirements from the posting. Reusing one summary across every application is one of the cheapest mistakes to fix."
    }
  ];

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": title,
        "description": description,
        "author": { "@type": "Organization", "name": "ResumeRadar" },
        "publisher": { "@type": "Organization", "name": "ResumeRadar" },
        "dateModified": today,
        "mainEntityOfPage": canonical
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

  const exampleFor = (role) => `${role.title} with [X]+ years of experience in ${role.core[0]}, ${role.core[1]}, and ${role.core[2]}. Known for work that connects ${role.focus}; [add one measurable result, e.g. “cut cycle time 30%”]. Looking for a role where ${role.core[3] || role.core[0]} and ${role.tools[0]} matter.`;

  const sections = CATEGORIES.map((cat) => {
    const items = cat.slugs.map((slug) => roles.find((r) => r.slug === slug)).filter(Boolean);
    return `<h2 id="cat-${cat.slugs[0]}">${esc(cat.title)}</h2>
      ${items.map((role) => `<h3 id="${role.slug}">${esc(role.title)}</h3>
      <div class="summary-example"><p>${esc(exampleFor(role))}</p></div>
      <p class="small muted" style="margin-top:8px"><a href="roles/${role.slug}.html">See the ${esc(role.title)} keyword guide →</a></p>`).join("\n")}`;
  }).join("\n");

  const body = `<main>
    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Summary library</p>
        <h1>Resume summary examples for 29 roles.</h1>
        <p class="lede">A summary is not an objective statement. It is the first evidence a recruiter reads. Steal the structure, replace the brackets with true specifics, and keep the measurable result.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Check my resume free</a>
          <a class="btn btn-ghost btn-lg" href="free-ats-resume-template.html">Get the free template</a>
        </div>
      </div>
    </section>

    <section class="page-body">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>The three-sentence formula</h2>
          <ol>
            <li><strong>Who you are.</strong> Title, years of experience, and the three skills the posting cares about most.</li>
            <li><strong>Proof.</strong> One measurable result with a verb, a scope, and an outcome. A number is better than an adjective.</li>
            <li><strong>Direction.</strong> The kind of role or problem you want next — specific enough to sound intentional.</li>
          </ol>
          <p>Keep it to 40–70 words. Write it last, after the experience bullets, so the proof is already on the page. Never claim a skill you would not want to be interviewed on.</p>

          <h2 id="examples">Examples by role</h2>
          <p>Every example below is a scaffold, not a script. The bracketed parts are where your evidence goes. Copy the vocabulary that is true for you, then run the scan against the actual posting.</p>
          ${sections}

          <h2 id="faq">Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>

          <p style="margin-top:28px"><a class="btn btn-primary" href="index.html#checker">Scan my resume free</a></p>
        </div>

        <aside class="aside-card">
          <h3>Summary checklist</h3>
          <ul class="check-list">
            <li>Title matches the posting</li>
            <li>Two to four sentences</li>
            <li>One measurable result</li>
            <li>Three relevant skills</li>
            <li>No “results-driven” filler</li>
            <li>No first-person pronouns</li>
          </ul>
          <a class="btn btn-primary btn-block" href="index.html#checker">Test my summary</a>
          <p class="small muted" style="margin-top:10px">Free, private, no account.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Does your summary match the job?</h2>
            <p>Paste your resume and the posting. Get the score, the missing terms, and the fixes.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;

  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function guidesPage() {
  const title = "Free Resume Guides — ATS Format, Templates, Verbs & Summaries";
  const description = "Free resume guides: ATS formatting, a copyable template, 200+ action verbs, 29 summary examples, keyword extraction, and role-specific checklists.";
  const canonical = `${siteUrl}/guides.html`;
  const cards = [
    ["free-ats-resume-checker.html", "Free ATS resume checker", "The full scanner: score, keyword gaps, parser warnings, and fixes. No signup, no upload.", "Free tool"],
    ["jobscan-alternative.html", "ResumeRadar vs Jobscan", "An honest comparison of a private, $9 one-time checker and Jobscan's account-based job-search platform.", "Comparison"],
    ["sample-report.html", "Sample ATS report", "See a complete example report before you scan your own resume.", "Example"],
    ["ats-resume-format.html", "ATS resume format", "The nine formatting rules that decide whether a parser can read your resume — and what to remove.", "Format guide"],
    ["free-ats-resume-template.html", "Free ATS resume template", "A single-column skeleton you can copy, download, or print. No email gate.", "Template"],
    ["resume-action-verbs.html", "200+ resume action verbs", "Strong verbs by function, plus weak phrases to replace and before/after examples.", "Verb library"],
    ["resume-summary-examples.html", "Resume summary examples", "29 role-specific summaries built on a three-sentence formula you can adapt.", "Summary library"],
    ["resume-summary-generator.html", "Resume summary generator", "Write three editable summary variants from a role, skills, and one measurable result.", "Free tool"],
    ["keyword-extractor.html", "Job keyword extractor", "Paste a posting to get a ranked, copyable keyword list, then send it to the scanner.", "Free tool"],
    ["roles.html", "Role keyword guides", "29 roles with core skills, tools, and action verbs. Start with the words employers search.", "Role guides"],
    ["web3.html", "Crypto & Web3 resumes", "Smart contract, blockchain, DeFi, product, and community roles with Web3 vocabulary.", "Web3"],
    ["how-it-works.html", "How the scoring works", "What the score measures, what it cannot predict, and why the scan stays in your browser.", "Method"]
  ];
  const body = `<main>
    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Guide library</p>
        <h1>Everything you need to make a resume readable.</h1>
        <p class="lede">Free, practical guides to ATS formatting, keywords, summaries, and evidence. No signup, no email gate, no 40-page ebook.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-lg" href="free-ats-resume-template.html">Get the template</a>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="guide-grid">
          ${cards.map(([href, name, desc, tag]) => `<a class="guide-card" href="${href}"><strong>${esc(name)}</strong><span>${esc(desc)}</span><em>${esc(tag)}</em></a>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Reading is free. Fixing is faster with a score.</h2>
            <p>Paste your resume and a real job post. See the keyword gaps and parser warnings in about 20 seconds.</p>
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
    { loc: `${siteUrl}/free-ats-resume-checker.html`, priority: "0.9", changefreq: "monthly" },
    { loc: `${siteUrl}/jobscan-alternative.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/sample-report.html`, priority: "0.6", changefreq: "monthly" },
    { loc: `${siteUrl}/guides.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/keyword-extractor.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/ats-resume-format.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/free-ats-resume-template.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/resume-action-verbs.html`, priority: "0.7", changefreq: "monthly" },
    { loc: `${siteUrl}/resume-summary-examples.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/resume-summary-generator.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/web3.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/pay-with-usdc.html`, priority: "0.5", changefreq: "yearly" },
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
fs.writeFileSync(path.join(siteDir, "free-ats-resume-checker.html"), freeAtsCheckerPage());
fs.writeFileSync(path.join(siteDir, "jobscan-alternative.html"), jobscanAlternativePage());
fs.writeFileSync(path.join(siteDir, "sample-report.html"), sampleReportPage());
fs.writeFileSync(path.join(siteDir, "resume-summary-examples.html"), summaryExamplesPage());
fs.writeFileSync(path.join(siteDir, "resume-summary-generator.html"), summaryGeneratorPage());
fs.writeFileSync(path.join(siteDir, "guides.html"), guidesPage());
fs.writeFileSync(path.join(siteDir, "sitemap.xml"), sitemap());
fs.writeFileSync(
  path.join(siteDir, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
);

console.log(`Built ${roles.length} role pages + roles.html + summary examples + summary generator + guides + sitemap.xml + robots.txt`);
console.log(`Canonical base: ${siteUrl}`);
console.log(`Pro price: ${priceLabel}`);
if (siteUrl.includes("resumeradar.example")) {
  console.log("\nNOTE: siteUrl is still the placeholder. Set it in site/assets/config.js or run:");
  console.log("      SITE_URL=https://yourdomain.com npm run build");
}
