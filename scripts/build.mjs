#!/usr/bin/env node
/*
 * Builds the static SEO layer from site/assets/roles.js:
 *   - site/roles/<slug>.html  (39 role landing pages)
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
  { title: "Technology & data", slugs: ["software-engineer", "data-analyst", "devops-engineer", "cybersecurity-analyst", "data-scientist", "machine-learning-engineer", "frontend-developer", "backend-developer", "data-engineer", "cloud-engineer", "qa-engineer"] },
  { title: "Business & finance", slugs: ["product-manager", "project-manager", "business-analyst", "marketing-manager", "sales-representative", "accountant", "financial-analyst", "operations-manager", "human-resources", "supply-chain", "customer-service", "administrative-assistant", "customer-success-manager", "recruiter", "executive-assistant"] },
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
          <a href="${prefix}private-ats-resume-checker.html">Private, no-upload checker</a>
          <a href="${prefix}jobscan-alternative.html">Jobscan alternative</a>
          <a href="${prefix}teal-alternative.html">Teal alternative</a>
          <a href="${prefix}rezi-alternative.html">Rezi alternative</a>
          <a href="${prefix}why-am-i-not-getting-interviews.html">Why no interviews?</a>
          <a href="${prefix}career-change-resume-checker.html">Career change resume</a>
          <a href="${prefix}new-grad-resume-checker.html">New grad resume</a>
          <a href="${prefix}remote-job-resume-checker.html">Remote job resume</a>
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
        <p class="small" style="margin-top:16px"><a class="link-arrow" href="../roles.html">See all 39 role guides →</a></p>
      </div>
    </section>
  </main>`;

  return shell({ title, description, canonical, prefix: "../", body, jsonLd });
}

function rolesIndexPage() {
  const title = "ATS Resume Guides for 39 Roles — Free Keyword Lists";
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
      a: "Yes. You can scan against one of 39 built-in role checklists. Adding a real posting makes the result more specific because the keyword match is built from the employer's language."
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
          <p>Anyone applying through a company portal: software engineers, nurses, teachers, analysts, designers, accountants, operations managers, and the 39 role guides on this site. It is also useful for career changers who need to see which language from the new field is missing from an old resume.</p>

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
              <tr><td>Role-specific keyword lists</td><td>39 free role guides, including 5 Web3 roles</td><td>Broader general job-search content</td></tr>
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

function tealAlternativePage() {
  const title = "Free Teal Alternative — No Account, $9 One-Time Pro | ResumeRadar";
  const description = "An honest comparison of ResumeRadar and Teal: a private, no-signup ATS scan with a $9 one-time Pro report versus an account-based resume builder with a Free Forever plan and Teal+ subscriptions.";
  const canonical = `${siteUrl}/teal-alternative.html`;
  const verified = "November 14, 2026";
  const faq = [
    {
      q: "Is ResumeRadar a Teal alternative?",
      a: "For one task, yes: checking a resume against a specific job posting. ResumeRadar gives you a score, missing keywords, parser warnings, and fixes without an account or resume upload. Teal is the better fit if you want to build and store multiple resumes, use designed templates, and manage a broader job search inside an account."
    },
    {
      q: "How much does Teal cost?",
      a: "Teal advertises a Free Forever plan. Teal+ was listed at $13 per week, $29 per 30 days, or $79 per 90 days when we checked on November 14, 2026. Teal sets its own prices and they can change, so verify the current offer on Teal's pricing page before buying."
    },
    {
      q: "What does Teal include for free?",
      a: "At the time of checking, Teal's free plan included 10 resume templates, top-5 keyword matching, and basic resume analysis. Teal+ unlocked unlimited templates, keyword matching, and analysis. Check Teal's site for the current limits, because plan details change."
    },
    {
      q: "Does ResumeRadar require an account?",
      a: "No. You paste resume text and a job description, and the scan runs in your browser. There is no signup, no resume upload endpoint, and no server-side resume storage. Pro is a one-time $9 unlock, not a subscription."
    },
    {
      q: "Which one should I use?",
      a: "Use Teal if you want a resume builder with templates and an account that stores your documents, and you are comfortable with a subscription for unlimited analysis. Use ResumeRadar if you want one private, low-cost check of the posting in front of you and would rather not create another account."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Teal alternative", "item": canonical }
        ]
      },
      {
        "@type": "Article",
        "headline": title,
        "description": description,
        "author": { "@type": "Organization", "name": "ResumeRadar" },
        "publisher": { "@type": "Organization", "name": "ResumeRadar" },
        "dateModified": "2026-11-14",
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>Teal alternative
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Honest comparison</p>
        <h1>A lighter Teal alternative for one ATS check.</h1>
        <p class="lede">Teal is a resume builder and job-search platform with a genuinely useful free plan. ResumeRadar does one narrower job: it scores your resume against a specific posting, shows the keyword gaps, and explains the fixes — without an account, an upload, or a subscription.</p>
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
          <p>If you want to build, store, and reuse resumes, Teal is the more complete product. It has designed templates, a free tier that never expires, and paid plans for unlimited analysis. If you want a private, inexpensive check of the posting in front of you, ResumeRadar is deliberately smaller: no account, no document storage, and a one-time price instead of a subscription.</p>
          <p class="small muted">Teal prices and plan limits below were checked on <strong>${verified}</strong> at <a href="https://www.tealhq.com/pricing" rel="nofollow noopener">tealhq.com/pricing</a>.</p>

          <table class="score-table">
            <thead><tr><th>What matters</th><th>ResumeRadar</th><th>Teal</th></tr></thead>
            <tbody>
              <tr><td>Price model</td><td>$0 scan; $9 one-time Pro</td><td>Free Forever; Teal+ at $13/week, $29/30 days, or $79/90 days</td></tr>
              <tr><td>Account required</td><td>No</td><td>Yes, Teal is an account-based resume builder</td></tr>
              <tr><td>Resume handling</td><td>Stays in your browser; no upload endpoint</td><td>Stored in your Teal account for editing and reuse</td></tr>
              <tr><td>Resume templates</td><td>Not a builder; a free copyable single-column template</td><td>10 templates free; unlimited on Teal+</td></tr>
              <tr><td>Keyword matching</td><td>Full missing-keyword list in the scan; Pro ranks every gap</td><td>Top-5 keyword matching free; unlimited on Teal+</td></tr>
              <tr><td>Resume analysis</td><td>0–100 score with four categories on every free scan</td><td>Basic analysis free; fuller analysis on Teal+</td></tr>
              <tr><td>Job-search features</td><td>Not offered</td><td>Broader job-search platform; check Teal for the current feature list</td></tr>
              <tr><td>Best for</td><td>One private, low-cost ATS check</td><td>Building and managing resumes in an account</td></tr>
            </tbody>
          </table>

          <h2>When Teal is the better choice</h2>
          <p>Choose Teal if you are actively building resumes and want designed templates, a place to store multiple versions, and a free plan you can keep using indefinitely. Teal's free tier is unusually generous for a resume builder: 10 templates, top-5 keyword matching, and basic analysis at no cost. If those limits cover your search, you may not need to pay anyone. Teal+ makes sense if you want unlimited templates and analysis and you are applying often enough to justify a subscription.</p>

          <h2>When ResumeRadar is the better choice</h2>
          <p>Choose ResumeRadar if you already have a resume you like and need to know whether it matches one specific posting. There is no account to create, no document library to maintain, and no resume upload. The scan runs in your browser, and the $9 Pro unlock is a single payment rather than a recurring charge. It is also a practical fit for technical and Web3 roles, where the keyword lists are specific.</p>

          <h2>What the free scan actually shows</h2>
          <p>The free report gives you a 0–100 score, four category scores, the top five missing keywords, parser warnings, and the first four fixes. Pro adds every missing keyword ranked by importance, the complete role checklist, every fix, a cover-letter outline, eight interview questions, and a downloadable text report. There is no subscription and no recurring charge.</p>

          <h2>How the comparison was made</h2>
          <p>This page compares the products on the tasks ResumeRadar is built for. Teal's features and prices are set by Teal and can change; the figures above were checked on ${verified}, and you should verify them on Teal's pricing page before buying. ResumeRadar is our own product, so treat this comparison as a disclosed vendor comparison rather than an independent review. We have tried to state Teal's offer accurately, including where its free plan is the better deal. ResumeRadar is not affiliated with, endorsed by, or sponsored by Teal. Teal is a trademark of its owner.</p>

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

function reziAlternativePage() {
  const title = "Free Rezi Alternative — No Account, $9 One-Time Pro | ResumeRadar";
  const description = "An honest comparison of ResumeRadar and Rezi: a private, no-signup ATS scan with a $9 one-time Pro report versus an AI resume builder with a free tier, a $29/month Pro plan, and a $149 lifetime option.";
  const canonical = `${siteUrl}/rezi-alternative.html`;
  const verified = "November 14, 2026";
  const faq = [
    {
      q: "Is ResumeRadar a Rezi alternative?",
      a: "For one task, yes: checking a resume against a specific job posting. ResumeRadar gives you a score, missing keywords, parser warnings, and fixes without an account or resume upload. Rezi is the better fit if you want an AI resume builder, designed templates, and a place to store and rewrite resumes inside an account."
    },
    {
      q: "How much does Rezi cost?",
      a: "Rezi advertises a free plan at $0, a Pro plan at $29 per month, and a Lifetime plan at $149 one-time when we checked on November 14, 2026. Rezi sets its own prices and they can change, so verify the current offer on Rezi's pricing page before buying."
    },
    {
      q: "What does Rezi include for free?",
      a: "At the time of checking, Rezi's free plan included 1 resume, 1 AI interview, 3 PDF downloads, standard format templates, and the AI resume writer and editor. The Rezi Score and keyword targeting were listed as limited on the free plan and full on Pro."
    },
    {
      q: "Does ResumeRadar require an account?",
      a: "No. You paste resume text and a job description, and the scan runs in your browser. There is no signup, no resume upload endpoint, and no server-side resume storage. Pro is a one-time $9 unlock, not a subscription."
    },
    {
      q: "Which one should I use?",
      a: "Use Rezi if you want AI help rewriting the resume itself and a template library, and you are comfortable creating an account. Use ResumeRadar if you already have resume text you trust and want one private, low-cost check of the posting in front of you."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Rezi alternative", "item": canonical }
        ]
      },
      {
        "@type": "Article",
        "headline": title,
        "description": description,
        "author": { "@type": "Organization", "name": "ResumeRadar" },
        "publisher": { "@type": "Organization", "name": "ResumeRadar" },
        "dateModified": "2026-11-14",
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>Rezi alternative
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Honest comparison</p>
        <h1>A lighter Rezi alternative for one ATS check.</h1>
        <p class="lede">Rezi is an AI resume builder with templates, rewriting tools, and a free tier. ResumeRadar does one narrower job: it scores the resume you already have against a specific posting, shows the keyword gaps, and explains the fixes — without an account, an upload, or a subscription.</p>
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
          <p>If you want AI writing help and a template library, Rezi is the more complete product. It offers a free plan for one resume, a $29/month Pro plan for unlimited work, and a $149 lifetime option. If you want to test the resume you already wrote against the job you are about to apply for, ResumeRadar is smaller on purpose: no account, no document storage, and a one-time price.</p>
          <p class="small muted">Rezi prices and plan limits below were checked on <strong>${verified}</strong> at <a href="https://www.rezi.ai/pricing" rel="nofollow noopener">rezi.ai/pricing</a>.</p>

          <table class="score-table">
            <thead><tr><th>What matters</th><th>ResumeRadar</th><th>Rezi</th></tr></thead>
            <tbody>
              <tr><td>Price model</td><td>$0 scan; $9 one-time Pro</td><td>Free $0; Pro $29/month; Lifetime $149 one-time</td></tr>
              <tr><td>Account required</td><td>No</td><td>Yes, Rezi is an account-based resume builder</td></tr>
              <tr><td>Resume handling</td><td>Stays in your browser; no upload endpoint</td><td>Stored in your Rezi account for editing and reuse</td></tr>
              <tr><td>Resume templates</td><td>Not a builder; a free copyable single-column template</td><td>Multiple template formats; all templates on Pro</td></tr>
              <tr><td>ATS scoring</td><td>0–100 score with four categories on every free scan</td><td>Rezi Score uses 23 metrics; limited free, full on Pro</td></tr>
              <tr><td>Keyword targeting</td><td>Full missing-keyword list in the scan; Pro ranks every gap</td><td>Limited free; full keyword targeting on Pro</td></tr>
              <tr><td>AI writing &amp; rewriting</td><td>Cover-letter outline in Pro; no AI resume rewriting</td><td>AI resume writer and editor on the free plan</td></tr>
              <tr><td>Best for</td><td>One private, low-cost ATS check</td><td>Building and rewriting resumes with AI in an account</td></tr>
            </tbody>
          </table>

          <h2>When Rezi is the better choice</h2>
          <p>Choose Rezi if the resume itself needs work and you want help rewriting it. Its free plan includes the AI resume writer and editor, one resume, one AI interview, and three PDF downloads, which is enough to test the workflow. Pro at $29/month removes the resume and download limits and unlocks the full Rezi Score and keyword targeting. The $149 lifetime plan is worth comparing with a few months of Pro if you expect to keep using the builder.</p>

          <h2>When ResumeRadar is the better choice</h2>
          <p>Choose ResumeRadar if you do not want another account or another AI rewriting your experience. Paste the resume text and the posting, and the scanner shows what a parser can read, which important terms are missing, and which fixes are worth making first. The scan is free, Pro is $9 once, and nothing is uploaded. That makes it a low-commitment second opinion before you apply.</p>

          <h2>What the free scan actually shows</h2>
          <p>The free report gives you a 0–100 score, four category scores, the top five missing keywords, parser warnings, and the first four fixes. Pro adds every missing keyword ranked by importance, the complete role checklist, every fix, a cover-letter outline, eight interview questions, and a downloadable text report. There is no subscription and no recurring charge.</p>

          <h2>How the comparison was made</h2>
          <p>This page compares the products on the tasks ResumeRadar is built for. Rezi's features and prices are set by Rezi and can change; the figures above were checked on ${verified}, and you should verify them on Rezi's pricing page before buying. ResumeRadar is our own product, so treat this comparison as a disclosed vendor comparison rather than an independent review. We have tried to state Rezi's offer accurately, including where its free plan or lifetime option may be the better deal. ResumeRadar is not affiliated with, endorsed by, or sponsored by Rezi. Rezi is a trademark of its owner.</p>

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

function atsScoreGuidePage() {
  const title = "What Is a Good ATS Score? (2026 Guide) | ResumeRadar";
  const description = "A good ATS score is usually 75 or higher, not 100. Learn what the 0–100 score measures, which bands matter, and how to raise yours without keyword stuffing.";
  const canonical = `${siteUrl}/what-is-a-good-ats-score.html`;
  const faq = [
    {
      q: "What is a good ATS score?",
      a: "For a specific job posting, 75 or higher is a good working target. Scores of 85 or more are strong. A score between 65 and 74 usually means the resume is relevant but has fixable keyword, structure, or evidence gaps. Below 65 needs structural work before you apply."
    },
    {
      q: "Is 100 a good ATS score?",
      a: "Not automatically. A perfect score can mean the resume is saturated with the posting's language, which reads as keyword stuffing to a human. Aim for 80–90 with truthful terms, clear structure, and evidence of outcomes. The number is a diagnostic, not a trophy."
    },
    {
      q: "Does a high ATS score guarantee an interview?",
      a: "No. The score measures keyword coverage, parser-safe structure, measurable impact, and readability against one posting. It cannot predict recruiter judgment, timing, competition, or whether the employer's ATS is configured differently. Use it to decide what to edit, not as a hiring prediction."
    },
    {
      q: "How do I raise my ATS score quickly?",
      a: "Add the posting's most important missing terms inside experience bullets where they are true, use standard section headings and month-year dates, quantify a few bullets, and cut walls of text. Re-scan after each edit so you can see which change actually moved the score."
    },
    {
      q: "Why do different ATS checkers give different scores?",
      a: "Each tool uses different keyword lists, weighting, parsing rules, and role checklists. Two tools can disagree by 10 points or more on the same resume. Compare the reasons and the recommended fixes, not just the number."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "What is a good ATS score?", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>What is a good ATS score?
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Score guide</p>
        <h1>What is a good ATS score?</h1>
        <p class="lede">Short answer: for a specific job posting, <strong>75 or higher is a good target</strong>. Scores of 85+ are strong. But 100 is not the goal — a perfect score can mean keyword stuffing. The number is a diagnostic, not a hiring prediction.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Check my score free</a>
          <a class="btn btn-ghost btn-lg" href="sample-report.html">See a sample report</a>
        </div>
        <p class="role-note">Free · no signup · your resume stays in this browser tab</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>The score bands</h2>
          <table class="score-table">
            <thead><tr><th>Score</th><th>Grade</th><th>What it usually means</th></tr></thead>
            <tbody>
              <tr><td><strong>85–100</strong></td><td>A</td><td>Strong match. The posting's language, structure, and evidence are all in good shape. Fix small gaps, then apply.</td></tr>
              <tr><td><strong>75–84</strong></td><td>B</td><td>Good match. A few targeted edits — usually missing terms or one weak section — could move it into the top band.</td></tr>
              <tr><td><strong>65–74</strong></td><td>C</td><td>Relevant but uneven. The resume may parse cleanly but miss important keywords, metrics, or role-specific vocabulary.</td></tr>
              <tr><td><strong>Below 65</strong></td><td>D/F</td><td>Needs structural work. Check contact details, headings, dates, length, and whether the resume addresses the posting at all.</td></tr>
            </tbody>
          </table>
          <p class="small muted">These bands are a reading aid, not an industry standard. Different tools weight different signals.</p>

          <h2>What the score measures</h2>
          <p>ResumeRadar uses four checks with fixed weights, so the same text always produces the same result:</p>
          <ul>
            <li><strong>Keyword match — 40%.</strong> How much of the posting's important language and the role checklist appears in the resume, including synonyms and short forms.</li>
            <li><strong>Impact and achievements — 25%.</strong> Whether bullets show outcomes, scope, numbers, percentages, or money instead of listing duties.</li>
            <li><strong>Structure and parsing — 20%.</strong> Contact details, standard headings, readable dates, skills sections, and length — the fields an ATS reconstructs first.</li>
            <li><strong>Readability — 15%.</strong> Whether a human can skim the resume: bullet length, walls of text, and vague phrasing.</li>
          </ul>

          <h2>Why 100 is not the goal</h2>
          <p>A 100 means every weighted term and structural check passed. That can be useful, but it can also reward repeating the posting's language until the resume sounds like a copy of the job ad. Recruiters notice. The better target is the highest score you can reach with terms that are true, evidence you can defend in an interview, and a document that still reads like a person wrote it.</p>
          <p>Most strong applications land in the 80s. If you are stuck in the 60s, the fix is usually not more keywords — it is a missing section, a weak contact line, or bullets that describe duties instead of results.</p>

          <h2>How to raise your score</h2>
          <ol>
            <li><strong>Scan against the actual posting.</strong> A generic role checklist is useful, but the posting's language is what the employer's filter sees.</li>
            <li><strong>Fix the highest-weight gaps first.</strong> Add the most important missing terms inside experience bullets where they are true. Do not create a hidden keyword list.</li>
            <li><strong>Repair the structure.</strong> Put your name, email, phone, city, and LinkedIn in plain text at the top. Use standard headings and month-year dates.</li>
            <li><strong>Quantify a few bullets.</strong> Scope, time saved, revenue, percentage, or user count. Two or three strong metrics beat ten vague claims.</li>
            <li><strong>Re-scan after each edit.</strong> Watch which category moves. Stop when the remaining gaps are things you cannot honestly claim.</li>
          </ol>

          <h2>What a score cannot tell you</h2>
          <p>It cannot reproduce every employer's ATS configuration, predict whether a recruiter will advance you, or measure whether you are a good fit for the team. It also cannot fix a resume that is aimed at the wrong role. Use the score to prioritize edits, then make the final call yourself.</p>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Check your score</h3>
          <p class="small muted">Paste your resume and a real posting. Get the score, the gaps, and the fixes in about 20 seconds.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Scan my resume</a>
          <a class="btn btn-ghost btn-block" href="how-it-works.html" style="margin-top:8px">How the scoring works</a>
          <p class="small muted" style="margin-top:10px">No account. Nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Stop guessing what the filter sees.</h2>
            <p>20 seconds. Free. Private. Then fix the first four gaps.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function tailorGuidePage() {
  const title = "How to Tailor a Resume to a Job Description (2026) | ResumeRadar";
  const description = "A five-step process for tailoring a resume to a real job posting: extract the requirements, map truthful evidence, rewrite bullets, fix structure, and re-scan before applying.";
  const canonical = `${siteUrl}/how-to-tailor-a-resume.html`;
  const faq = [
    {
      q: "How long should tailoring a resume take?",
      a: "With a reusable master resume, 10 to 20 minutes per posting is realistic. The first tailored version takes longer because you are building the master and deciding which evidence to lead with. After that, most of the work is choosing and reordering, not rewriting from scratch."
    },
    {
      q: "Do I need a different resume for every job?",
      a: "For the roles you actually want, yes — at least a tailored summary, a reordered skills section, and three to five rewritten bullets. You do not need a completely different document. Keep one master resume with all of your evidence, then cut and reframe it for each posting."
    },
    {
      q: "Should I copy the job description's exact words?",
      a: "Mirror the exact terms where they are true, especially for tools, platforms, and certifications. Do not paste sentences, add skills you cannot discuss, or hide keywords in white text. The goal is to match the employer's vocabulary, not to impersonate the posting."
    },
    {
      q: "What should I change first?",
      a: "The top third of the resume: the summary, the skills section, and the first two bullets of your most relevant role. That is what a recruiter skims first and where the posting's most important terms should appear. Structure fixes come next."
    },
    {
      q: "How do I know the tailoring worked?",
      a: "Re-scan against the same posting. The keyword and structure categories should move, and the remaining gaps should be things you honestly cannot claim. Then read it as a human: if it sounds like a keyword list, rewrite the bullets in plain language."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "How to tailor a resume", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>How to tailor a resume
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Tailoring guide</p>
        <h1>How to tailor a resume to a job description.</h1>
        <p class="lede">Tailoring is not rewriting your whole resume for every application. It is choosing the right evidence, using the employer's vocabulary where it is true, and fixing the structure before you hit submit. Here is a five-step process you can repeat in about 15 minutes.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Tailor with a free scan</a>
          <a class="btn btn-ghost btn-lg" href="free-ats-resume-template.html">Get the free template</a>
        </div>
        <p class="role-note">No signup · no upload · your resume stays in this browser tab</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>Why tailoring beats volume</h2>
          <p>A generic resume asks the reader to translate your experience into their role. A tailored resume does that translation for them. You are not inventing a new career; you are surfacing the parts of your real experience that match this posting, in the order the employer cares about.</p>
          <p>The practical target is to change 20–30% of the document: the summary, the order of the skills section, three to five bullets, and sometimes one project. Everything else can stay.</p>

          <h2>Step 1: Extract the posting's real requirements</h2>
          <p>Read the posting twice. The first time, highlight the tools, platforms, and skills named explicitly. The second time, separate the must-haves from the boilerplate. A line like “fast-paced environment” is not a keyword; a line like “experience with Kubernetes and Terraform” is.</p>
          <p>List the top 8–12 terms. Put the ones that appear in the responsibilities or requirements above the ones that appear only in a company description. If the posting names a specific tool you use, that term should appear in your resume exactly as written.</p>

          <h2>Step 2: Map your evidence</h2>
          <p>For each requirement, write down one true example from your experience. If you do not have an example, mark it as a gap and leave it out. Do not add a skill you cannot defend in an interview.</p>
          <table class="score-table">
            <thead><tr><th>Posting requirement</th><th>Your evidence</th><th>Where it will appear</th></tr></thead>
            <tbody>
              <tr><td>Kubernetes</td><td>Migrated 18 services to a managed Kubernetes cluster</td><td>Most recent role, bullet 2</td></tr>
              <tr><td>Incident response</td><td>Ran the on-call rotation and postmortems for a 12-service platform</td><td>Most recent role, bullet 4</td></tr>
              <tr><td>Terraform</td><td>No production example</td><td>Leave out, or mention only if true</td></tr>
            </tbody>
          </table>
          <p>This worksheet is the whole trick. It stops you from keyword-stuffing and shows you which parts of the posting your resume genuinely answers.</p>

          <h2>Step 3: Rewrite the top bullets</h2>
          <p>Start with the first two bullets of your most relevant role. Each bullet should connect an action to an outcome, using the posting's vocabulary where it is accurate. Compare:</p>
          <div class="compare-grid">
            <div class="compare-card compare-before">
              <h3>Before</h3>
              <p>Responsible for maintaining backend services and helping with deployments.</p>
            </div>
            <div class="compare-card compare-after">
              <h3>After</h3>
              <p>Migrated 18 Node.js services to Kubernetes on AWS, cutting deploy time from 25 minutes to 6 and reducing failed releases by 40%.</p>
            </div>
          </div>
          <p>The second version names the tools, the scope, and the result. It is also true to the work. That is the standard: specific, relevant, and defensible.</p>

          <h2>Step 4: Fix the structure</h2>
          <p>Before you add another keyword, make sure the document parses. Put your name, email, phone, city, and LinkedIn in plain text at the top. Use standard headings — Summary, Skills, Experience, Education. Write dates as month and year. Keep the layout single-column. A great keyword match inside a table or text box may never reach the recruiter.</p>
          <p>If you are reusing a template, check that the PDF still has selectable text. A screenshot of a resume is not a resume to an ATS.</p>

          <h2>Step 5: Re-scan and stop</h2>
          <p>Paste the tailored resume and the same posting into the scanner. Look at the category that moved and the gaps that remain. If the remaining gaps are things you cannot honestly claim, stop. A resume that reaches the high 80s with true evidence is stronger than a 100 that reads like a copied job ad.</p>
          <p>Then read it once as a human. If a bullet sounds like it was assembled from a keyword list, rewrite it in plain language. The recruiter is the second filter.</p>

          <h2>Common tailoring mistakes</h2>
          <ul>
            <li><strong>Rewriting everything.</strong> You do not need a new resume for each posting; you need a new top third and a reordered evidence set.</li>
            <li><strong>Adding skills you cannot defend.</strong> A keyword that fails an interview is worse than a gap.</li>
            <li><strong>Ignoring the structure.</strong> A parser-safe document with slightly fewer keywords beats a beautiful layout that extracts as gibberish.</li>
            <li><strong>Chasing 100.</strong> Past a certain point you are optimizing for the checker, not the hiring manager.</li>
            <li><strong>Tailoring after you apply.</strong> The scan takes 20 seconds; do it before you submit.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Tailor with a scan</h3>
          <p class="small muted">Paste your resume and the posting. See the missing terms and the fixes before you apply.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Scan my resume</a>
          <a class="btn btn-ghost btn-block" href="what-is-a-good-ats-score.html" style="margin-top:8px">What is a good score?</a>
          <p class="small muted" style="margin-top:10px">Free · no account · nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>One posting. One scan. Then apply.</h2>
            <p>See the keyword gaps and the structure issues in about 20 seconds.</p>
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
      a: "No. It uses deterministic templates built from the role vocabulary in the 39 role guides. That means the output is predictable and private, but you still need to add your own true evidence. It will not invent experience for you."
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
          <a class="btn btn-ghost btn-lg" href="resume-summary-examples.html">See 39 examples</a>
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
          <p>“Seeking a challenging role where I can grow” describes what you want from an employer. A summary should describe what an employer gets. Lead with the role and the evidence, not with a wish. The generator uses the same role vocabulary as the 39 keyword guides because that is the language both a parser and a recruiter are scanning for.</p>

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
  const title = "Resume Summary Examples for 39 Roles (2026) — Free Templates";
  const description = "Role-specific resume summary examples for 39 jobs, plus a three-sentence formula you can adapt. Free, no signup, with links to each ATS keyword guide.";
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
        <h1>Resume summary examples for 39 roles.</h1>
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

function privateCheckerPage() {
  const title = "Private ATS Resume Checker — No Upload, No Signup (2026) | ResumeRadar";
  const description = "A private ATS resume checker that runs entirely in your browser. No upload, no account, no resume storage. See what local scanning can and cannot do, and how to verify it.";
  const canonical = `${siteUrl}/private-ats-resume-checker.html`;
  const faq = [
    {
      q: "Is this ATS resume checker really free?",
      a: "The score, category breakdown, top missing keywords, and top fixes are free. The full Pro report — every missing keyword, the complete role checklist, every fix, a cover-letter outline, interview prompts, and a text export — is a one-time $9 unlock. There is no subscription."
    },
    {
      q: "Do I need an account or an email address?",
      a: "No. There is no signup, no email capture, and no login. Paste the resume and the posting, run the scan, and close the tab when you are done. Pro access is stored on the device, and a USDC payment can be restored with its transaction link."
    },
    {
      q: "Does the site store my resume?",
      a: "No. The resume and job description stay in the page's memory and are discarded when you close or reload the tab. The only saved values are the Pro unlock state and the payment method or public transaction hash. There is no resume database and no upload endpoint."
    },
    {
      q: "Can I use it offline?",
      a: "Once the page and its JavaScript have loaded, the scan itself makes no network request. You can open the browser's Network tab and confirm that running a scan sends nothing. Loading the page in the first place still requires a connection unless your browser has cached it."
    },
    {
      q: "Does it use AI to score my resume?",
      a: "No. The score comes from deterministic rules: keyword coverage, parser-safe structure, measurable impact, and readability. The same resume and posting always produce the same result, and you can inspect the engine. It does not send your text to an AI API."
    },
    {
      q: "Can it read a PDF file directly?",
      a: "No. Paste the plain text of your resume. That is deliberate: copying text out of a PDF is also a useful parser test. If the pasted text loses headings, dates, or bullets, an ATS may struggle with the same file."
    },
    {
      q: "Is a local score as accurate as an upload-based checker?",
      a: "It measures different things. This tool checks whether the document is readable and whether it covers the posting's vocabulary. It cannot predict hiring outcomes, and neither can an upload-based checker. Treat any ATS score as an editing list, not a guarantee."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Private ATS resume checker", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>Private ATS resume checker
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Privacy-first checker</p>
        <h1>A private ATS resume checker that never uploads your resume.</h1>
        <p class="lede">Most resume checkers ask you to upload a file, create an account, or send your work history to a server. ResumeRadar runs the entire scan in your browser. Here is what that means in practice, how to verify it, and where the trade-offs are.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Scan without uploading</a>
          <a class="btn btn-ghost btn-lg" href="how-it-works.html">How the score works</a>
        </div>
        <p class="role-note">No upload endpoint · no account · no resume storage</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>What “no upload” actually means</h2>
          <p>It means the resume text you paste is read by JavaScript that is already running in the page. The scoring engine receives the text as a local variable. There is no <code>fetch</code> call carrying the resume, no form post, no file storage, and no server-side queue. When you close the tab, the text is gone from the page's memory.</p>
          <p>This is different from a tool that uploads a PDF, extracts the text on a server, sends it to a model, and stores the result in an account. That architecture can be convenient, but it also creates a copy of your work history somewhere you do not control.</p>

          <h2>Why resume uploads deserve scrutiny</h2>
          <p>A resume contains your name, contact details, employers, dates, education, and sometimes a home city. It is enough to build a profile of where you have worked and when. Upload-based tools need a retention policy, an access policy, and a security program. Many have them; some do not. You usually cannot tell from the outside.</p>
          <p>Local scanning removes that entire category of risk for the scan itself. It does not make the site anonymous — the static host still sees a request for the page — but it means the document is not part of the request.</p>

          <h2>How to verify this page is not uploading your resume</h2>
          <ol>
            <li>Open the browser's developer tools and switch to the Network tab.</li>
            <li>Paste a resume and a job description, then run the scan.</li>
            <li>Watch the requests. The page assets load once; the scan itself makes no request with the resume text.</li>
            <li>Optional: disconnect from the network after the page loads and run the scan again. The score still appears.</li>
            <li>Search the page source for the scoring engine. It is a readable JavaScript file, not a remote API call.</li>
          </ol>
          <p>You do not have to trust a privacy claim. You can watch the network tab.</p>

          <h2>What local scanning can do</h2>
          <ul>
            <li><strong>Check keyword coverage</strong> against a real posting, with synonyms and short forms.</li>
            <li><strong>Flag parser risks</strong> such as missing contact details, non-standard headings, ambiguous dates, and dense bullets.</li>
            <li><strong>Measure impact language</strong> — quantified bullets, action verbs, weak phrases, and outcome density.</li>
            <li><strong>Check readability</strong> — sentence length, bullet length, passive voice, and filler.</li>
            <li><strong>Give a repeatable score</strong> so you can compare two versions of the same resume.</li>
          </ul>

          <h2>What it cannot do</h2>
          <ul>
            <li><strong>It cannot predict whether you will get an interview.</strong> Hiring depends on the market, the applicant pool, timing, referrals, and human judgment.</li>
            <li><strong>It cannot read a PDF for you.</strong> Paste the text. Copying it out is also a useful parser test.</li>
            <li><strong>It cannot review your portfolio, references, or interview answers.</strong> It only looks at the document and the posting.</li>
            <li><strong>It cannot invent true experience.</strong> A keyword you cannot defend is worse than a gap.</li>
          </ul>

          <div class="compare-grid">
            <div class="compare-card compare-before">
              <h3>Upload-based checker</h3>
              <p>File leaves your device · account often required · retention policy varies · may use a third-party AI model · convenience of PDF parsing.</p>
            </div>
            <div class="compare-card compare-after">
              <h3>ResumeRadar</h3>
              <p>Text stays in the tab · no account · no resume database · deterministic rules · you paste text and can verify the network traffic.</p>
            </div>
          </div>

          <h2>Who this is for</h2>
          <p>It is a good fit if you are applying for a confidential role, if your resume contains client names or security details, if you do not want another account, or if you simply want to see how the score is calculated. It is also useful for career changers who want a fast gap check before rewriting a whole document.</p>
          <p>If you need a human review, a PDF redesign, or a recruiter database, a local checker is not a substitute. Use it for the first pass, then invest your time in the parts a script cannot judge.</p>

          <h2>How the scan handles your data</h2>
          <p>The resume and posting are held in memory. The site stores only the Pro state in <code>localStorage</code>: whether Pro is unlocked and the payment method or public transaction hash used. It does not store the resume, your name, your email address, or your wallet's private key. The <a href="privacy.html">privacy page</a> lists every stored value.</p>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Scan without uploading</h3>
          <p class="small muted">Paste the resume and a real posting. The score, keyword gaps, and parser warnings are generated in this tab.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Open the checker</a>
          <a class="btn btn-ghost btn-block" href="privacy.html" style="margin-top:8px">Read the privacy page</a>
          <a class="btn btn-ghost btn-block" href="how-it-works.html" style="margin-top:8px">See the scoring method</a>
          <p class="small muted" style="margin-top:10px">No account · no upload · no resume storage.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Your resume is nobody else's data.</h2>
            <p>Run the first scan locally. Watch the network tab if you want proof.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function careerChangePage() {
  const title = "Career Change Resume Checker — Transferable Skills and ATS Gaps (2026) | ResumeRadar";
  const description = "A practical career-change resume guide: build an evidence inventory, translate transferable skills into the target role's language, avoid functional-resume parsing traps, and check the resume against a real posting.";
  const canonical = `${siteUrl}/career-change-resume-checker.html`;
  const faq = [
    {
      q: "Do I need a functional resume for a career change?",
      a: "Usually no. Many applicant tracking systems expect a reverse-chronological experience section with dated roles. A functional resume that groups skills and hides dates can parse poorly and make recruiters hunt for your history. Keep the chronology, use the summary and skills sections to foreground transferable evidence, and reframe the bullets inside each role."
    },
    {
      q: "How do I explain a career gap?",
      a: "Keep the dates honest and add a short, factual line if it helps. You do not need to apologize or invent consulting work. A gap with a simple explanation is easier to process than missing dates that look like an error."
    },
    {
      q: "Should I remove my old experience?",
      a: "No. Keep the roles and dates, but condense older or less relevant positions and use the space you save for evidence that maps to the target role. Removing chronology creates parsing and credibility problems."
    },
    {
      q: "How do I know which skills transfer?",
      a: "Take each must-have requirement from the target posting and write down one true example from your work, projects, volunteering, or training. If the example is adjacent rather than direct, say what it actually was. If you have no example, treat it as a gap and leave it out."
    },
    {
      q: "What if I have no direct experience in the new field?",
      a: "Use projects, certifications, volunteer work, and adjacent responsibilities. A bridge role, freelance project, or internal transfer can also create direct evidence. Do not claim experience you cannot defend in an interview."
    },
    {
      q: "Will an ATS reject me because I am changing careers?",
      a: "An ATS does not know your intent. It parses the document and matches terms. The risk is that your resume still speaks the old field's language. Use the target role's vocabulary where it is true, keep the structure readable, and scan against the posting you actually want."
    },
    {
      q: "How many resume versions do I need?",
      a: "Keep one master resume with all of your evidence, then tailor 20 to 30 percent for each posting: the summary, the skills order, three to five bullets, and sometimes one project. You do not need a completely different document for every application."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Career change resume checker", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>Career change resume checker
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Career change guide</p>
        <h1>Career change resume checker: translate your experience without inventing it.</h1>
        <p class="lede">A career-change resume is not a list of everything you have done. It is an argument that your old evidence answers the new role's requirements. Here is a repeatable way to build that argument, then test it against the posting.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Check my transferable gaps</a>
          <a class="btn btn-ghost btn-lg" href="how-to-tailor-a-resume.html">Read the tailoring guide</a>
        </div>
        <p class="role-note">Free scan · no signup · nothing uploaded</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>Why career-change resumes get filtered</h2>
          <p>An ATS and a recruiter are both looking for evidence that you can do the target job. If your resume is still written in the old field's vocabulary, that evidence is hard to find. The work may transfer; the language does not.</p>
          <p>The fix is translation, not fabrication. You are not inventing a new career history. You are describing the same true work in the words the target role uses, and leading with the parts that transfer.</p>

          <h2>Step 1: Build an evidence inventory</h2>
          <p>List eight to twelve things you actually did, with scope and a result. Include paid work, projects, volunteering, certifications, and training. Then map each one to a transferable skill and a target-role phrase.</p>
          <table class="score-table">
            <thead><tr><th>What you did</th><th>Transferable skill</th><th>Target-role language</th></tr></thead>
            <tbody>
              <tr><td>Managed 14 retail staff and opened two stores</td><td>Team leadership, planning, budgeting</td><td>Led a 14-person cross-functional team through two launches, on schedule and 8% under budget</td></tr>
              <tr><td>Trained new hires on POS and closing process</td><td>Onboarding, documentation, process</td><td>Built onboarding documentation and trained 20+ new hires, cutting ramp time from six weeks to four</td></tr>
              <tr><td>Handled escalated customer issues</td><td>Stakeholder communication, conflict resolution</td><td>Resolved escalated customer issues and reduced repeat contacts by 22%</td></tr>
            </tbody>
          </table>
          <p>Only use rows you can defend in an interview. The worksheet is a translation tool, not a permission slip to exaggerate.</p>

          <h2>Step 2: Pick one target role and read its language</h2>
          <p>Choose one target role, not three. Extract the top eight to twelve terms from a real posting. The <a href="keyword-extractor.html">keyword extractor</a> and the <a href="roles.html">role guides</a> can help. Then sort your inventory into three buckets: strong evidence, adjacent evidence, and gaps.</p>
          <p>Adjacent evidence counts. If you have not managed a product, but you have run a project with deadlines, a budget, and stakeholders, that is project evidence. Describe what it was, not what it was not.</p>

          <h2>Step 3: Rewrite the top third</h2>
          <p>The summary should name the target role, the transferable scope, two relevant skills, and one result. Compare:</p>
          <div class="compare-grid">
            <div class="compare-card compare-before">
              <h3>Before</h3>
              <p>Experienced retail manager seeking a career change into project management.</p>
            </div>
            <div class="compare-card compare-after">
              <h3>After</h3>
              <p>Project manager with six years leading cross-functional retail teams of up to 14 people. Delivered two store launches on schedule and 8% under budget; completing a project management certificate.</p>
            </div>
          </div>
          <p>The second version names the target role, the transferable scope, and a concrete result. It does not pretend the retail work was product work.</p>

          <h2>Step 4: Keep the structure boring</h2>
          <p>Many parsers expect a reverse-chronological experience section with dated roles. A functional resume that groups skills and hides dates often parses poorly and makes a recruiter hunt for your history. Keep the chronology, use a skills section for the target vocabulary, and reframe bullets in place.</p>
          <p>Standard headings, month-and-year dates, one column, and real text still matter. A career-change resume does not get an exemption from the parser.</p>

          <h2>Step 5: Scan against the target posting, then stop</h2>
          <p>Paste the resume and a real posting in the field you want. Fix structure warnings first, add three to five missing terms that are true, and rewrite two bullets with scope and a result. Re-scan. The remaining gaps should be things you honestly cannot claim.</p>
          <p>Do not scan against your old role. The score is only meaningful against the job you want.</p>

          <h2>What to do about a gap or a certificate in progress</h2>
          <p>Keep the dates honest. If you are enrolled in a course, write “expected [month year]” rather than implying you already have the credential. If you have an employment gap, a short factual line is enough. You do not need to invent consulting work to fill it.</p>

          <h2>Common career-change mistakes</h2>
          <ul>
            <li><strong>Using a functional resume to hide the transition.</strong> It usually makes parsing worse and the chronology harder to follow.</li>
            <li><strong>Leading with what you want.</strong> “Seeking a career change” describes your situation, not the employer's problem.</li>
            <li><strong>Keeping old-field jargon in every bullet.</strong> Translate the work into the target field's vocabulary where it is accurate.</li>
            <li><strong>Dumping unrelated experience to fill space.</strong> Condense it and use the room for transferable evidence.</li>
            <li><strong>Applying to a senior target role without showing scope.</strong> Lead with the level you can defend and the evidence that supports it.</li>
            <li><strong>Chasing a perfect score.</strong> Past the high 80s, you are usually optimizing for the checker, not the hiring manager.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Check the target, not the old role</h3>
          <p class="small muted">Scan your current resume against a real posting in the field you want. See which target terms are missing and which fixes are honest.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-block" href="how-to-tailor-a-resume.html" style="margin-top:8px">Tailoring worksheet</a>
          <a class="btn btn-ghost btn-block" href="roles.html" style="margin-top:8px">Browse target roles</a>
          <p class="small muted" style="margin-top:10px">No account · nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Translate the evidence. Then test it.</h2>
            <p>A 20-second scan shows whether the target role's language is actually on the page.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function newGradPage() {
  const title = "New Grad Resume Checker — Entry-Level ATS Guide (2026) | ResumeRadar";
  const description = "A new grad resume checker guide: turn coursework, projects, internships, and part-time work into ATS-readable evidence, avoid empty skill lists, and check against a real entry-level posting.";
  const canonical = `${siteUrl}/new-grad-resume-checker.html`;
  const faq = [
    {
      q: "How long should a new grad resume be?",
      a: "One page is the right default. You are selecting the most relevant projects, internships, and part-time work, not cataloguing every course. If you have several years of relevant internships and publications, two pages can be justified, but one page is easier for a recruiter to skim."
    },
    {
      q: "Do I need an internship to have a good new grad resume?",
      a: "No. Projects, part-time jobs, volunteering, coursework, and certifications can all show evidence. What matters is that each entry names the scope, the tools, and a result. An internship is useful, but it is not the only proof that you can do the work."
    },
    {
      q: "Should I include my GPA?",
      a: "Include it if it is strong for your field, if the posting requires it, or if you are applying to a graduate program. Otherwise, leave it out and use the space for projects and evidence. A GPA without context rarely helps a recruiter decide."
    },
    {
      q: "Can I list coursework as experience?",
      a: "Put coursework under Education or a Projects section, not under professional experience. Do not imply you were employed when you were not. A capstone project can still be strong evidence if you describe the scope, your role, and the result."
    },
    {
      q: "What if my projects have no metrics?",
      a: "Use honest scope instead: team size, users, dataset size, number of features, runtime, grade, or time saved. “Built a 12-table SQL schema for a course project” is more useful than “worked with databases.” Do not invent numbers."
    },
    {
      q: "Should I include a photo or a skill-bar chart?",
      a: "No. Photos and graphical skill bars add little for an ATS and can distract a recruiter. Use plain text, standard headings, and a simple skills list. Keep the design clean rather than decorative."
    },
    {
      q: "How do I handle little or no work experience?",
      a: "Lead with projects, relevant coursework, and the skills you can defend. Use part-time or volunteer work to show reliability, customer handling, and teamwork. Apply to entry-level roles whose must-haves you mostly meet, and build direct evidence through a project or internship where you can."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "New grad resume checker", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>New grad resume checker
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">New grad guide</p>
        <h1>New grad resume checker: prove you can do the job without inventing experience.</h1>
        <p class="lede">You do not need years of full-time experience to have evidence. You need to show scope, tools, and outcomes from the experience you do have. Here is how to build an entry-level resume that a parser and a recruiter can both read.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Check my entry-level resume</a>
          <a class="btn btn-ghost btn-lg" href="free-ats-resume-template.html">Get the free template</a>
        </div>
        <p class="role-note">Free scan · no signup · nothing uploaded</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>Why new grad resumes get filtered</h2>
          <p>Entry-level resumes often read like a list of courses and soft adjectives: hardworking, detail-oriented, passionate about technology. None of that tells a recruiter what you can do. If the posting asks for Python, SQL, and a portfolio, the resume needs evidence of those things, not a claim that you are eager to learn them.</p>
          <p>The other common failure is structural. A two-column template, a photo, or a skills chart can look polished and still parse badly. A new grad resume does not get an exemption from the same parser rules as anyone else's.</p>

          <h2>Build an evidence inventory</h2>
          <p>List the work you actually did: projects, internships, part-time jobs, volunteering, coursework, and certifications. For each one, write the scope, the tools, and a result. Then translate it into the target role's language.</p>
          <table class="score-table">
            <thead><tr><th>What you did</th><th>Evidence to show</th><th>Target-role language</th></tr></thead>
            <tbody>
              <tr><td>Built a course-planning app with three classmates</td><td>Stack, users, performance</td><td>Built a Flask and PostgreSQL app with a three-person team; cut page load from 2.1s to 1.2s for 200 test users</td></tr>
              <tr><td>Interned at a small marketing agency</td><td>Deliverables, tools, result</td><td>Produced 12 social campaigns in Canva and Hootsuite; increased engagement 18% over eight weeks</td></tr>
              <tr><td>Worked part-time in retail</td><td>Volume, reliability, training</td><td>Trained five new hires and handled 60+ customers per shift while maintaining 99% checkout accuracy</td></tr>
            </tbody>
          </table>
          <p>Use honest scope when you do not have a metric. “Team of four,” “12-table schema,” “200 test users,” and “three-week deadline” are all evidence. Do not invent numbers to fill the column.</p>

          <h2>Pick one target role and extract its terms</h2>
          <p>Choose one entry-level role, not five. Pull the top eight to twelve must-haves from a real posting. The <a href="keyword-extractor.html">keyword extractor</a> and the <a href="roles.html">role guides</a> can help. Then mark which requirements you can support with a project, internship, or part-time example.</p>
          <p>If a posting asks for three years of experience and you have none, that is a targeting problem, not a resume wording problem. Apply to roles whose core requirements you mostly meet, and use the resume to make the match obvious.</p>

          <h2>Write a summary that leads with evidence</h2>
          <p>Use a simple formula: target role + degree or graduation date + two relevant skills + one result. Compare:</p>
          <div class="compare-grid">
            <div class="compare-card compare-before">
              <h3>Before</h3>
              <p>Motivated computer science graduate seeking an entry-level software engineering role.</p>
            </div>
            <div class="compare-card compare-after">
              <h3>After</h3>
              <p>Computer science graduate (May 2026) with project experience in Python, Flask, and PostgreSQL. Built a 200-user course-planning app with a three-person team and cut query time by 40%.</p>
            </div>
          </div>
          <p>The second version names the target, the stack, and a concrete result. It does not claim professional experience you do not have.</p>

          <h2>Put projects and internships in the right places</h2>
          <p>Use a standard order: Education, Skills, Experience, Projects. If your projects are stronger than your work history, put a Projects section directly under Education. Label internships and part-time jobs accurately; do not call coursework “professional experience.”</p>
          <p>For each project, include the problem, your role, the stack, and the result. A link to a live demo or repository is useful if it is working and you are proud of it. Do not include a link you have not checked.</p>

          <h2>Keep the format boring</h2>
          <p>One column. Standard headings. Real selectable text. Month-and-year dates. No photo, no skill bars, no tables or text boxes holding key content. Keep it to one page unless you have a genuine reason to go longer.</p>
          <p>Use a plain PDF export and run the copy-paste test: select the text, paste it into a plain editor, and see whether the resume still reads. If it does not, an ATS may see the same thing.</p>

          <h2>Scan against an entry-level posting</h2>
          <p>Paste the resume and a real entry-level posting into the scanner. Fix structure warnings first, add three to five missing terms that are true, and rewrite two bullets with scope and a result. Re-scan. Stop when the remaining gaps are things you cannot claim.</p>
          <p>Do not scan against a senior role to chase a higher score. The score is only meaningful against a job you can actually pursue.</p>

          <h2>Common new grad mistakes</h2>
          <ul>
            <li><strong>Listing courses instead of evidence.</strong> A course name is not a result; a project is.</li>
            <li><strong>Using soft adjectives as skills.</strong> “Hardworking” and “team player” are not searchable tools.</li>
            <li><strong>Hiding projects below unrelated jobs.</strong> Lead with the evidence that matches the target role.</li>
            <li><strong>Using a decorative template.</strong> Columns, photos, and skill bars can break parsing.</li>
            <li><strong>Applying to roles that require experience you do not have.</strong> Target entry-level roles whose must-haves you mostly meet.</li>
            <li><strong>Chasing a perfect score.</strong> Past the high 80s, you are usually optimizing for the checker, not the hiring manager.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Check the entry-level match</h3>
          <p class="small muted">Paste your resume and a real entry-level posting. See which target terms are missing and which fixes are honest.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-block" href="free-ats-resume-template.html" style="margin-top:8px">Free ATS template</a>
          <a class="btn btn-ghost btn-block" href="roles.html" style="margin-top:8px">Browse target roles</a>
          <p class="small muted" style="margin-top:10px">No account · nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Your projects are evidence. Make them readable.</h2>
            <p>A 20-second scan shows whether the entry-level posting's language is actually on the page.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function remoteJobPage() {
  const title = "Remote Job Resume Checker — ATS Keywords and Distributed-Work Evidence (2026) | ResumeRadar";
  const description = "A remote-job resume checker guide: show distributed-work evidence, use the posting's async and tool keywords honestly, avoid location and time-zone mismatches, and scan against a real remote posting.";
  const canonical = `${siteUrl}/remote-job-resume-checker.html`;
  const faq = [
    {
      q: "Do I need remote experience to get a remote job?",
      a: "Not necessarily. You can show distributed-work evidence from any role: written updates, documentation, asynchronous coordination, independent ownership, and collaboration across locations or shifts. Projects and volunteer work can count too. What matters is that the evidence is specific and true."
    },
    {
      q: "Should I put “remote” in my address?",
      a: "Use your actual city, state, and country. If you are open to remote work, say so in the summary or a location line, but do not fake a location to pass a filter. Many postings have real country, state, or time-zone restrictions, and misrepresenting your location creates problems later."
    },
    {
      q: "How do I show asynchronous communication?",
      a: "Point to artifacts: decision documents, runbooks, RFCs, written status updates, support tickets, and handoffs. A bullet such as “Documented the release process in runbooks used by three on-call teams” is stronger than “excellent communicator.”"
    },
    {
      q: "What should I say about time zones?",
      a: "State your time zone and the overlap you can realistically offer. If the posting requires four hours of overlap with a specific region, say whether you can meet it. Do not claim availability you cannot sustain."
    },
    {
      q: "Will an ATS reject a remote resume?",
      a: "There is no separate remote-resume format. The same rules apply: standard headings, one column, real text, month-and-year dates, and the posting's must-have terms where they are true. The remote-specific work is in the evidence and the location details."
    },
    {
      q: "Should I list my home-office setup?",
      a: "Usually no. Focus on work evidence. If the posting explicitly asks about equipment, connectivity, or a security setup, answer it directly in the application rather than filling the resume with it."
    },
    {
      q: "How do I handle a hybrid role?",
      a: "Follow the posting. If it requires a certain number of days on-site, state your proximity or willingness to commute honestly. A hybrid role is not a remote role, and pretending otherwise wastes both sides' time."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Remote job resume checker", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>Remote job resume checker
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Remote work guide</p>
        <h1>Remote job resume checker: show you can work without a hallway.</h1>
        <p class="lede">Remote employers are not only checking whether you can do the job. They are checking whether you can do it without constant supervision, across time zones, and in writing. Here is how to put that evidence on the resume, then test it against the posting.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Check my remote-job fit</a>
          <a class="btn btn-ghost btn-lg" href="how-to-tailor-a-resume.html">Read the tailoring guide</a>
        </div>
        <p class="role-note">Free scan · no signup · nothing uploaded</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>Why remote resumes get filtered</h2>
          <p>The posting usually says more than “remote.” It may say “remote within the US,” “async-first,” “four hours of overlap with CET,” or “some travel.” Those are requirements, not decoration. A resume that ignores them can look like a mismatch before anyone reads the experience.</p>
          <p>The second issue is evidence. “Self-starter” and “excellent communicator” are claims. A recruiter looking for a distributed teammate wants to see written updates, documentation, independent ownership, and coordination across locations.</p>

          <h2>Step 1: Read the remote model in the posting</h2>
          <p>Write down the logistics before you edit the resume: country or state restriction, time-zone overlap, travel expectations, on-call, language, and work authorization. If the posting says “US only” and you are not authorized to work in the US, do not try to word your way around it. Apply where you genuinely fit.</p>
          <p>Then extract the top eight to twelve must-have terms. The <a href="keyword-extractor.html">keyword extractor</a> can rank them, and the <a href="roles.html">role guides</a> can help with the role vocabulary.</p>

          <h2>Step 2: Build remote evidence</h2>
          <p>List the work you actually did and translate it into distributed-work evidence. The goal is not to claim you worked from home; it is to show how you worked when no one was looking over your shoulder.</p>
          <table class="score-table">
            <thead><tr><th>What you did</th><th>Remote evidence</th><th>Target-role language</th></tr></thead>
            <tbody>
              <tr><td>Worked with a team across three time zones</td><td>Coordination, documentation, handoffs</td><td>Coordinated with engineers in UTC+1 and UTC-7; documented decisions in Notion and ran async standups</td></tr>
              <tr><td>Handled customer issues on a remote support team</td><td>Written communication, volume, satisfaction</td><td>Resolved 40+ support tickets per week in Zendesk with a 95% customer satisfaction score</td></tr>
              <tr><td>Managed a project during a remote period</td><td>Ownership, tools, delivery</td><td>Led a six-person distributed project; shipped on time using Jira, Slack, and weekly written status updates</td></tr>
            </tbody>
          </table>
          <p>Only claim tools and arrangements you actually used. If your team was co-located, you can still show written documentation, independent ownership, and coordination with other offices or shifts.</p>

          <h2>Step 3: Put remote evidence in the top third</h2>
          <p>Use a summary that names the target role, the distributed scope, the tools, and a result. Compare:</p>
          <div class="compare-grid">
            <div class="compare-card compare-before">
              <h3>Before</h3>
              <p>Experienced project manager seeking a remote role with a collaborative team.</p>
            </div>
            <div class="compare-card compare-after">
              <h3>After</h3>
              <p>Project manager with five years leading distributed teams across three time zones. Shipped 12 releases using Jira, Slack, and async written updates, with 95% on-time delivery.</p>
            </div>
          </div>
          <p>The second version gives the recruiter something to verify. It also names the collaboration tools without turning the resume into a software list.</p>

          <h2>Step 4: Add a compact remote-collaboration line</h2>
          <p>Under Skills, add a short line such as “Remote collaboration: async updates, runbooks, time-zone handoffs, Slack, Notion, Jira.” Keep it to tools and practices you can discuss. Do not create a separate “Remote Work” section that pushes your experience down the page; integrate the evidence into the roles where it happened.</p>

          <h2>Step 5: Make location and authorization unambiguous</h2>
          <p>Put your city, state or region, and country in plain text at the top. If you are open to remote work, say so. If the posting requires work authorization in a specific country, state it accurately. If it requires hybrid attendance, state your proximity or willingness to commute.</p>
          <p>Do not hide your location to get past a filter. It creates a mismatch that surfaces later, and it is not fair to either side.</p>

          <h2>Step 6: Show written communication</h2>
          <p>Remote teams run on writing. Point to decision documents, runbooks, RFCs, status reports, support tickets, and handoffs. A bullet such as “Documented the release process in runbooks used by three on-call teams” is stronger than “excellent communicator.”</p>

          <h2>Step 7: Keep the structure boring and scan the posting</h2>
          <p>One column, standard headings, month-and-year dates, real selectable text, no photo or skill bars. Then paste the resume and the actual remote posting into the scanner. Fix structure warnings first, add three to five missing terms that are true, and rewrite two bullets with scope and a result. Re-scan and stop when the remaining gaps are things you cannot claim.</p>

          <h2>Common remote-job mistakes</h2>
          <ul>
            <li><strong>Stuffing the word “remote.”</strong> It is a work arrangement, not a skill; the evidence is how you worked.</li>
            <li><strong>Listing every collaboration tool.</strong> Name the ones you used and can discuss.</li>
            <li><strong>Omitting location and time zone.</strong> These are real filters for distributed roles.</li>
            <li><strong>Applying to restricted locations.</strong> A “remote” role can still be limited to one country or state.</li>
            <li><strong>Claiming to be a self-starter without evidence.</strong> Show independent ownership and written follow-through.</li>
            <li><strong>Using a decorative template.</strong> Remote does not mean the parser takes a day off.</li>
            <li><strong>Chasing a perfect score.</strong> Past the high 80s, you are usually optimizing for the checker, not the hiring manager.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Check the remote posting, not the word</h3>
          <p class="small muted">Paste your resume and a real remote posting. See which must-have terms and logistics are missing from the page.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-block" href="keyword-extractor.html" style="margin-top:8px">Extract job keywords</a>
          <a class="btn btn-ghost btn-block" href="roles.html" style="margin-top:8px">Browse target roles</a>
          <p class="small muted" style="margin-top:10px">No account · nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Show how you work, not just where.</h2>
            <p>A 20-second scan shows whether the remote posting's must-haves are actually on the page.</p>
          </div>
          <a class="btn btn-lg" href="index.html#checker">Scan my resume</a>
        </div>
      </div>
    </section>
  </main>`;
  return shell({ title, description, canonical, prefix: "", body, jsonLd });
}

function notGettingInterviewsPage() {
  const title = "Why Am I Not Getting Interviews? 12 Resume Fixes (2026) | ResumeRadar";
  const description = "Applying but not hearing back? Work through 12 resume checks in order: parser failures, keyword gaps, generic summaries, duty-based bullets, format problems, and targeting mistakes.";
  const canonical = `${siteUrl}/why-am-i-not-getting-interviews.html`;
  const faq = [
    {
      q: "How many applications should I send before changing my resume?",
      a: "Track a batch of 10 to 15 applications against one version of the resume. If none produce a screen, change the top third, the keyword match, and the roles you are targeting before sending another batch. A single application is too small a sample, and a hundred identical applications mostly repeats the same mistake."
    },
    {
      q: "Does a high ATS score guarantee an interview?",
      a: "No. A score only measures how readable and relevant the document is against one posting. Hiring decisions also depend on the market, the applicant pool, timing, referrals, and the hiring manager's judgment. Use the score to remove avoidable reasons for rejection, not as a prediction."
    },
    {
      q: "Should I use AI to rewrite my resume?",
      a: "It can help tighten phrasing and suggest structure, but you must verify every claim. Do not let it invent metrics, tools, or scope. A resume that reads well and fails an interview is worse than a plainly written one that is true."
    },
    {
      q: "What if I have an employment gap?",
      a: "Keep the dates honest and use the summary or a short line to explain the gap if it is relevant. You do not need to apologize for it. Recruiters are more confused by missing dates than by a gap with a simple explanation."
    },
    {
      q: "What if I am changing careers?",
      a: "Lead with transferable evidence and use the new field's vocabulary where it is accurate. A career-change resume should show what the employer gets, not a chronological apology. The tailoring guide has a worksheet for mapping old evidence to new requirements."
    }
  ];
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Why am I not getting interviews?", "item": canonical }
        ]
      },
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
  const body = `<main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span>Why am I not getting interviews?
      </nav>
    </div>

    <section class="page-hero">
      <div class="wrap">
        <p class="eyebrow">Diagnostic guide</p>
        <h1>Why am I not getting interviews? 12 resume fixes to try first.</h1>
        <p class="lede">If applications are going out and interviews are not coming back, the problem is often visible before a human reads the resume. Work through these twelve checks in order. Each one has a fix and a way to verify it.</p>
        <div class="role-actions">
          <a class="btn btn-primary btn-lg" href="index.html#checker">Find my resume gaps</a>
          <a class="btn btn-ghost btn-lg" href="how-to-tailor-a-resume.html">Read the tailoring guide</a>
        </div>
        <p class="role-note">Free scan · no signup · nothing uploaded</p>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap page-grid">
        <div class="prose">
          <h2>Start with the filter, not the hiring manager</h2>
          <p>Most applications are rejected before anyone reads them closely. The first filter is a parser or a recruiter skimming for a match. That means the highest-value fixes are structural and lexical: can the document be read, and does it answer this posting? Only after those are fixed does the story matter.</p>

          <h2>1. The resume fails the copy-paste test</h2>
          <p>Open your PDF, select all, and paste it into a plain text editor. If your contact line, section headings, dates, or bullets disappear or arrive scrambled, an ATS may see the same mess. Tables, text boxes, columns, headers, and footers are the usual causes.</p>
          <p><strong>Fix:</strong> use one column, real text, standard headings, and no critical content in a text box. <strong>Verify:</strong> the pasted text still reads like a resume.</p>

          <h2>2. The posting's must-have terms are missing</h2>
          <p>Extract the top 8–12 requirements from the posting. If the resume never names the tool, platform, certification, or domain the employer asked for, both the parser and the recruiter have to guess. That guess usually costs you the screen.</p>
          <p><strong>Fix:</strong> mirror the exact term where it is true, especially for tools and certifications. <strong>Verify:</strong> re-scan against the same posting and check that the remaining gaps are things you honestly cannot claim.</p>

          <h2>3. The summary is generic</h2>
          <p>“Seeking a challenging role where I can grow” describes what you want. A recruiter is looking for what they get. Replace it with the target role, your years or scope, two relevant skills, and one measurable result.</p>
          <p><strong>Fix:</strong> write three sentences: who you are, what you have done, and the result you repeat. <strong>Verify:</strong> the summary still makes sense if you remove the company name.</p>

          <h2>4. Bullets describe duties, not outcomes</h2>
          <p>“Responsible for maintaining backend services” is a job description. It tells the reader what you were assigned, not what changed. Lead with an action, add scope, and end with a result.</p>
          <div class="compare-grid">
            <div class="compare-card compare-before">
              <h3>Before</h3>
              <p>Responsible for maintaining backend services and helping with deployments.</p>
            </div>
            <div class="compare-card compare-after">
              <h3>After</h3>
              <p>Migrated 18 Node.js services to Kubernetes, cutting deploy time from 25 minutes to 6 and reducing failed releases by 40%.</p>
            </div>
          </div>
          <p><strong>Verify:</strong> every bullet should answer “so what changed?” If it only names an activity, rewrite it or cut it.</p>

          <h2>5. There is no evidence of scale</h2>
          <p>Numbers make relevance concrete: team size, budget, ticket volume, patient load, revenue, users, time saved, error rate. Use honest approximations when you do not have an exact figure. “About 40 engineers” is more useful than “large teams.”</p>

          <h2>6. The job titles do not map to the target</h2>
          <p>Internal titles are often opaque. If “Member of Technical Staff II” means “senior backend engineer” in the market, add the plain-language equivalent in parentheses. Do not change the official title; translate it.</p>

          <h2>7. Dates and locations are ambiguous</h2>
          <p>Write dates as month and year, with an end date for every role: “Jan 2022 – Mar 2024,” not “2022–24.” A missing end date can read as a gap, and a missing location can disqualify you from a hybrid role before anyone asks.</p>

          <h2>8. The top third is wasted</h2>
          <p>Recruiters skim the first screen. Put the summary, the core skills for the target role, and the most relevant experience there. Do not lead with a photo, an objective, or a list of every tool you have ever touched.</p>

          <h2>9. The resume is pitched at the wrong level</h2>
          <p>Applying to manager roles with an individual-contributor resume reads as a mismatch, and the reverse is also true. Lead with the level you can defend. For manager roles, show team size, hiring, and budget; for senior IC roles, show technical scope and judgment.</p>

          <h2>10. The applications are late or too broad</h2>
          <p>Response rates fall as a posting ages, and a resume that matches 40% of the must-haves is not a close call. Apply within the first days when you can, and prioritize roles where you meet most of the core requirements. Fewer, better-fit applications usually beat volume.</p>

          <h2>11. There is no human path in</h2>
          <p>A referral, an internal message, or a short note to the recruiter can move a resume from the pile to the shortlist. This is not a resume fix, but it changes outcomes. Ask former colleagues, alumni, and community contacts before you apply, not after.</p>

          <h2>12. You are reusing one resume across industries</h2>
          <p>A healthcare resume and a SaaS resume should not emphasize the same things. Keep one master document with all of your evidence, then tailor 20–30% of it for each posting: summary, skills order, three to five bullets, and sometimes one project.</p>

          <h2>A 15-minute triage</h2>
          <ol>
            <li>Run the copy-paste test and fix any parsing failure first.</li>
            <li>Paste the resume and the posting into the free scanner.</li>
            <li>Fix structure warnings before adding keywords.</li>
            <li>Add three to five missing terms that are true.</li>
            <li>Rewrite two bullets with scope and a result.</li>
            <li>Re-scan. Stop when the remaining gaps are things you cannot claim.</li>
            <li>Apply while the posting is still fresh.</li>
          </ol>

          <h2>What not to do</h2>
          <ul>
            <li><strong>Do not lie or stuff keywords.</strong> A term you cannot defend in an interview is worse than a gap.</li>
            <li><strong>Do not hide keywords in white text.</strong> It is dishonest, and modern parsers can flag it.</li>
            <li><strong>Do not chase a perfect score.</strong> Past the high 80s, you are usually optimizing for the checker, not the hiring manager.</li>
            <li><strong>Do not rewrite from scratch for every application.</strong> Build a master resume, then tailor the top third.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <div class="faq">
            ${faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("")}
          </div>
        </div>

        <aside class="aside-card">
          <h3>Find the avoidable gaps</h3>
          <p class="small muted">Paste your resume and a real posting. See the missing terms, parser warnings, and the fixes that matter first.</p>
          <a class="btn btn-primary btn-block" href="index.html#checker">Scan my resume free</a>
          <a class="btn btn-ghost btn-block" href="how-to-tailor-a-resume.html" style="margin-top:8px">Tailoring worksheet</a>
          <a class="btn btn-ghost btn-block" href="what-is-a-good-ats-score.html" style="margin-top:8px">What is a good score?</a>
          <p class="small muted" style="margin-top:10px">No account · nothing uploaded.</p>
        </aside>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <h2>Before you send another application, check the first filter.</h2>
            <p>A 20-second scan shows whether the resume is readable and whether it answers the posting.</p>
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
  const description = "Free resume guides: ATS formatting, a copyable template, 200+ action verbs, 39 summary examples, keyword extraction, and role-specific checklists.";
  const canonical = `${siteUrl}/guides.html`;
  const cards = [
    ["free-ats-resume-checker.html", "Free ATS resume checker", "The full scanner: score, keyword gaps, parser warnings, and fixes. No signup, no upload.", "Free tool"],
    ["private-ats-resume-checker.html", "Private, no-upload checker", "How the local scan works, how to verify it sends nothing, and where the trade-offs are.", "Privacy"],
    ["jobscan-alternative.html", "ResumeRadar vs Jobscan", "An honest comparison of a private, $9 one-time checker and Jobscan's account-based job-search platform.", "Comparison"],
    ["teal-alternative.html", "ResumeRadar vs Teal", "A disclosed comparison of a no-account, $9 one-time ATS check and Teal's Free Forever resume builder plus Teal+ plans.", "Comparison"],
    ["rezi-alternative.html", "ResumeRadar vs Rezi", "A disclosed comparison of a private, $9 one-time ATS scan and Rezi's AI resume builder, free tier, Pro plan, and lifetime option.", "Comparison"],
    ["what-is-a-good-ats-score.html", "What is a good ATS score?", "The score bands, the four weighted checks, and why a perfect score is not the goal.", "Score guide"],
    ["how-to-tailor-a-resume.html", "How to tailor a resume", "A five-step process for matching a resume to a real posting without keyword stuffing.", "Tailoring guide"],
    ["career-change-resume-checker.html", "Career change resume checker", "Map transferable evidence to the target role and avoid functional-resume parsing traps.", "Career change"],
    ["new-grad-resume-checker.html", "New grad resume checker", "Turn projects, internships, and part-time work into entry-level ATS evidence.", "New grad"],
    ["remote-job-resume-checker.html", "Remote job resume checker", "Show distributed-work evidence and get the location and time-zone details right.", "Remote work"],
    ["why-am-i-not-getting-interviews.html", "Why am I not getting interviews?", "Twelve resume checks for applications that are not turning into screens, plus a 15-minute triage.", "Diagnostic guide"],
    ["sample-report.html", "Sample ATS report", "See a complete example report before you scan your own resume.", "Example"],
    ["ats-resume-format.html", "ATS resume format", "The nine formatting rules that decide whether a parser can read your resume — and what to remove.", "Format guide"],
    ["free-ats-resume-template.html", "Free ATS resume template", "A single-column skeleton you can copy, download, or print. No email gate.", "Template"],
    ["assets/ats-resume-checklist.pdf", "ATS resume checklist (PDF)", "A one-page printable checklist covering parsing, keywords, evidence, and the final pre-submit test.", "Download"],
    ["resume-action-verbs.html", "200+ resume action verbs", "Strong verbs by function, plus weak phrases to replace and before/after examples.", "Verb library"],
    ["resume-summary-examples.html", "Resume summary examples", "39 role-specific summaries built on a three-sentence formula you can adapt.", "Summary library"],
    ["resume-summary-generator.html", "Resume summary generator", "Write three editable summary variants from a role, skills, and one measurable result.", "Free tool"],
    ["keyword-extractor.html", "Job keyword extractor", "Paste a posting to get a ranked, copyable keyword list, then send it to the scanner.", "Free tool"],
    ["roles.html", "Role keyword guides", "39 roles with core skills, tools, and action verbs. Start with the words employers search.", "Role guides"],
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
    { loc: `${siteUrl}/private-ats-resume-checker.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/jobscan-alternative.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/teal-alternative.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/rezi-alternative.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/what-is-a-good-ats-score.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/how-to-tailor-a-resume.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/why-am-i-not-getting-interviews.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/career-change-resume-checker.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/new-grad-resume-checker.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/remote-job-resume-checker.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/sample-report.html`, priority: "0.6", changefreq: "monthly" },
    { loc: `${siteUrl}/guides.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/keyword-extractor.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/ats-resume-format.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/free-ats-resume-template.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteUrl}/assets/ats-resume-checklist.pdf`, priority: "0.5", changefreq: "yearly" },
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
  // lastmod is intentionally omitted. It is optional, and stamping every URL
  // with the build date would falsely tell crawlers that all pages changed.
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
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
fs.writeFileSync(path.join(siteDir, "private-ats-resume-checker.html"), privateCheckerPage());
fs.writeFileSync(path.join(siteDir, "jobscan-alternative.html"), jobscanAlternativePage());
fs.writeFileSync(path.join(siteDir, "teal-alternative.html"), tealAlternativePage());
fs.writeFileSync(path.join(siteDir, "rezi-alternative.html"), reziAlternativePage());
fs.writeFileSync(path.join(siteDir, "what-is-a-good-ats-score.html"), atsScoreGuidePage());
fs.writeFileSync(path.join(siteDir, "how-to-tailor-a-resume.html"), tailorGuidePage());
fs.writeFileSync(path.join(siteDir, "why-am-i-not-getting-interviews.html"), notGettingInterviewsPage());
fs.writeFileSync(path.join(siteDir, "career-change-resume-checker.html"), careerChangePage());
fs.writeFileSync(path.join(siteDir, "new-grad-resume-checker.html"), newGradPage());
fs.writeFileSync(path.join(siteDir, "remote-job-resume-checker.html"), remoteJobPage());
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
