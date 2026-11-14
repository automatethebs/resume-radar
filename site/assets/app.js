/*
 * ResumeRadar analyzer UI.
 * Depends on: roles.js, engine.js, config.js, site.js
 */
(function () {
  "use strict";

  var cfg = window.RR_CONFIG || {};
  var library = window.RR_ROLES || { roles: [], bySlug: {} };
  var engine = window.RREngine;

  var resumeEl = document.getElementById("resume");
  var jobEl = document.getElementById("job");
  var roleEl = document.getElementById("role");
  var resumeCount = document.getElementById("resume-count");
  var jobCount = document.getElementById("job-count");
  var statusEl = document.getElementById("scan-status");
  var reportEl = document.getElementById("report");
  var form = document.getElementById("scanner-form");
  var analyzeBtn = document.getElementById("analyze-btn");

  var lastReport = null;
  var lastRole = null;

  var SAMPLE_RESUME = [
    "Alex Rivera",
    "Software Engineer",
    "Austin, TX | alex.rivera@example.com | (512) 555-0184 | linkedin.com/in/alexrivera | github.com/alexrivera",
    "",
    "SUMMARY",
    "Software engineer with 6 years of experience designing distributed systems, building REST and GraphQL APIs, and operating services on AWS. Led a Kubernetes migration that cut deploy time 45% and built observability practices adopted by three teams.",
    "",
    "EXPERIENCE",
    "",
    "Senior Software Engineer — Northwind Labs, Austin, TX",
    "Mar 2021 – Present",
    "• Built a customer-facing dashboard used by 12,000 monthly users, improving page load time by 34%.",
    "• Designed REST and GraphQL APIs in Node.js and PostgreSQL serving 2 million requests per day.",
    "• Migrated 14 microservices to Docker and Kubernetes on AWS, reducing deploy time from 45 to 8 minutes.",
    "• Added Redis caching and query tuning, cutting p95 latency 38% and database cost 21%.",
    "• Built observability dashboards and led incident response for three sev-1 events.",
    "• Created automated tests with Jest and GitHub Actions, reducing regression bugs by 28%.",
    "• Mentored two junior engineers, ran code reviews, and partnered with product on quarterly planning.",
    "• Responsible for the on-call runbook and incident review process for the platform team.",
    "",
    "Software Developer — Bluebonnet Software, Austin, TX",
    "Jun 2019 – Feb 2021",
    "• Developed React and TypeScript components for an internal admin tool used by 200 employees.",
    "• Collaborated with designers to ship a new checkout flow that increased conversion by 9%.",
    "• Debugged production issues and wrote runbooks for the on-call team.",
    "• Used Git for version control and participated in weekly sprint planning.",
    "• Maintained documentation for shared frontend components and reviewed pull requests.",
    "",
    "EDUCATION",
    "B.S. Computer Science — University of Texas at Austin, 2019",
    "",
    "SKILLS",
    "JavaScript, TypeScript, React, Node.js, GraphQL, REST APIs, PostgreSQL, Redis, AWS, Kubernetes, Docker, CI/CD, Microservices, Distributed Systems, System Design, Agile"
  ].join("\n");

  var SAMPLE_JOB = [
    "Senior Software Engineer — Cloud Platform (Austin, TX or Remote)",
    "",
    "We are looking for a senior software engineer to help build our cloud platform. You will design and ship reliable APIs, improve system performance, and work across teams to deliver customer-facing features.",
    "",
    "What you'll do",
    "• Design, build, and operate REST and GraphQL APIs serving millions of requests per day",
    "• Improve system scalability, reliability, and observability",
    "• Write clean, tested TypeScript and Python",
    "• Deploy services on AWS using Docker, Kubernetes, and Terraform",
    "• Partner with product managers and designers in an agile environment",
    "• Participate in code reviews, on-call rotation, and incident response",
    "",
    "Requirements",
    "• 5+ years of software engineering experience",
    "• Strong JavaScript/TypeScript, Node.js, React",
    "• Experience with PostgreSQL, Redis, and distributed systems",
    "• Hands-on experience with AWS, Kubernetes, Docker, CI/CD",
    "• Familiarity with microservices, system design, and performance optimization",
    "• Excellent communication and collaboration skills",
    "",
    "Nice to have",
    "• Experience with GraphQL, Terraform, and observability tools such as Datadog",
    "• Background in SaaS or high-growth startups"
  ].join("\n");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function countWords(text) {
    var t = String(text || "").trim();
    return t ? t.split(/\s+/).length : 0;
  }

  function updateCounts() {
    if (resumeCount && resumeEl) resumeCount.textContent = countWords(resumeEl.value) + " words";
    if (jobCount && jobEl) jobCount.textContent = countWords(jobEl.value) + " words";
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function scoreHeadline(score) {
    if (score >= 85) return "Excellent match";
    if (score >= 75) return "Good match";
    if (score >= 65) return "Needs work";
    if (score >= 50) return "Likely filtered";
    return "High risk";
  }

  function band(score) {
    if (score >= 85) return "a";
    if (score >= 75) return "b";
    if (score >= 65) return "c";
    if (score >= 50) return "d";
    return "f";
  }

  function chip(term, importance, matched, display) {
    var label = display || term;
    var weight = importance >= 0.7 ? "high" : importance >= 0.4 ? "medium" : "low";
    return '<button type="button" class="chip' + (matched ? " matched" : "") + '" data-copy="' + esc(label) +
      '" data-weight="' + weight + '" title="Click to copy">' +
      '<span class="dot"></span>' + esc(label) + (matched ? ' <span class="tick">✓</span>' : "") +
      "</button>";
  }

  function renderKeywords(report) {
    var k = report.keywords;
    var hasJob = k.jdCoverage != null;
    var missing = k.missing || [];
    var matched = k.matched || [];
    var visible = missing.slice(0, 5);
    var hidden = missing.slice(5);

    var stats = "";
    if (hasJob) {
      stats =
        '<div class="kw-summary">' +
          '<span class="kw-stat"><strong>' + k.jdCoverage + '%</strong> job keyword match</span>' +
          (k.roleCoverage != null ? '<span class="kw-stat"><strong>' + k.roleCoverage + '%</strong> role checklist</span>' : "") +
          '<span class="kw-stat"><strong>' + matched.length + "</strong> of " + (matched.length + missing.length) + " terms found</span>" +
        "</div>";
    } else {
      stats =
        '<div class="kw-summary">' +
          '<span class="kw-stat">No job description pasted — scored against the <strong>' + esc(report.roleName) + "</strong> checklist.</span>" +
        "</div>";
    }

    var matchedHtml = matched.length
      ? '<div class="chips">' + matched.slice(0, 14).map(function (m) { return chip(m.term, m.importance, true, m.display); }).join("") + "</div>"
      : '<p class="chips-empty">No keyword matches yet.</p>';

    var missingBlock = "";
    if (missing.length) {
      missingBlock =
        '<div class="block-head" style="margin-top:20px"><h3 style="font-size:.92rem">Missing or weak terms</h3>' +
        '<span class="tiny muted">Click to copy</span></div>' +
        '<div class="chips">' +
          visible.map(function (m) { return chip(m.term, m.importance, false, m.display); }).join("") +
          hidden.map(function (m) { return chip(m.term, m.importance, false, m.display).replace('class="chip', 'class="chip pro-only'); }).join("") +
        "</div>";
      if (hidden.length) {
        missingBlock +=
          '<div class="lock-card" style="margin-top:14px">' +
            '<div class="lock-icon" aria-hidden="true">🔒</div>' +
            '<div class="lock-copy"><strong>' + hidden.length + " more missing terms are in the full report</strong>" +
            "<span>Pro shows every gap, ranked by importance, plus the full role checklist.</span></div>" +
            '<button type="button" class="btn btn-sm btn-primary" data-unlock>Unlock ' + esc(cfg.priceLabel || "$9") + "</button>" +
          "</div>";
      }
    }

    return (
      '<section class="card" aria-labelledby="kw-heading">' +
        '<div class="block-head"><h3 id="kw-heading">Keyword match</h3><span class="tiny mono muted">40% of score</span></div>' +
        stats +
        '<div class="block-head" style="margin-top:8px"><h3 style="font-size:.92rem">Found in your resume</h3></div>' +
        matchedHtml +
        missingBlock +
        '<p class="kw-hint">ATS filters look for the posting\'s language. Add terms only where they are true — never stuff a hidden keyword list.</p>' +
      "</section>"
    );
  }

  function renderFindings(report) {
    var findings = report.findings || [];
    var visible = findings.slice(0, 4);
    var hidden = findings.slice(4);

    function findingHtml(f, extraClass) {
      var icon = f.severity === "good" ? "✓" : f.severity === "critical" ? "!" : "△";
      return '<article class="finding sev-' + f.severity + (extraClass ? " " + extraClass : "") + '">' +
        '<span class="finding-icon" aria-hidden="true">' + icon + "</span>" +
        "<div><h4>" + esc(f.title) + "</h4>" +
        "<p>" + esc(f.detail) + "</p>" +
        '<p class="fix"><b>Fix:</b> ' + esc(f.fix) + "</p></div>" +
      "</article>";
    }

    var html = visible.map(function (f) { return findingHtml(f); }).join("");
    hidden.forEach(function (f) { html += findingHtml(f, "pro-only"); });

    var passed = (report.passed || []).length
      ? '<div class="pass-list" style="margin-top:16px">' + report.passed.map(function (p) { return "<span>" + esc(p) + "</span>"; }).join("") + "</div>"
      : "";

    var issueCount = findings.filter(function (f) { return f.severity !== "good"; }).length;
    return (
      '<section class="card" aria-labelledby="fix-heading">' +
        '<div class="block-head"><h3 id="fix-heading">What to fix first</h3><span class="tiny mono muted">' + issueCount + (issueCount === 1 ? " issue" : " issues") + "</span></div>" +
        '<div class="findings">' + html + "</div>" +
        passed +
      "</section>"
    );
  }

  function renderRoleChecklist(report) {
    var terms = report.keywords.roleTerms || [];
    if (!terms.length) return "";
    var matched = terms.filter(function (t) { return t.matched; });
    return (
      '<section class="card pro-only" aria-labelledby="role-heading">' +
        '<div class="block-head"><h3 id="role-heading">' + esc(report.roleName) + " checklist</h3>" +
        '<span class="tiny mono muted">' + matched.length + "/" + terms.length + " covered</span></div>" +
        '<div class="chips">' + terms.map(function (t) { return chip(t.term, t.matched ? 1 : 0.8, t.matched, t.display); }).join("") + "</div>" +
        '<p class="kw-hint">This is the vocabulary hiring managers in this role scan for. Tick off what you can defend in an interview.</p>' +
      "</section>"
    );
  }

  function proAccessHtml() {
    if (!window.RRPro || !window.RRPro.restoreUrl) return "";
    var url = window.RRPro.restoreUrl();
    if (!url) return "";
    return '<section class="card pro-access" aria-labelledby="pro-access-heading">' +
      '<h3 id="pro-access-heading">Keep your Pro access</h3>' +
      '<p class="small muted">This device is unlocked. Save this private restore link to re-verify the payment on another device or after clearing browser data.</p>' +
      '<div class="restore-row"><code>' + esc(url) + '</code>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(url) + '">Copy link</button></div>' +
      '<p class="tiny muted">The link verifies the same on-chain payment. It does not contain or expose your resume.</p>' +
      '</section>';
  }

  function mountProAccess() {
    var slot = document.getElementById("pro-access-slot");
    if (!slot) return;
    slot.innerHTML = proAccessHtml();
  }

  function pickTerm(list, index, fallback) {
    if (list && list[index]) return list[index];
    if (list && list[0]) return list[0];
    return fallback;
  }

  function proPlaybook(report) {
    var k = report.keywords || {};
    function label(item) { return item.display || item.term; }
    function unique(list) {
      var seen = Object.create(null);
      return list.filter(function (item) {
        if (!item || seen[item]) return false;
        seen[item] = true;
        return true;
      });
    }
    var matched = (k.matched || []).map(label);
    var roleMatched = (k.roleTerms || []).filter(function (t) { return t.matched; }).map(label);
    var missing = unique((k.missing || []).map(label));
    var top = unique(matched.concat(roleMatched)).slice(0, 4);
    var gaps = missing.slice(0, 4);
    var role = report.roleName || "this role";
    var a = pickTerm(top, 0, "your strongest relevant skill");
    var b = pickTerm(top, 1, "a core tool from the posting");
    var c = pickTerm(top, 2, "a second relevant skill");
    var g1 = pickTerm(gaps, 0, "the posting's priority tool");
    var g2 = pickTerm(gaps, 1, "a gap you are actively closing");
    var g3 = pickTerm(gaps, 2, "a requirement you have not used yet");

    var coverLetter = [
      "Dear hiring team,",
      "",
      "I am applying for the " + role + " role. In my most recent position I ... [one sentence with your strongest measurable result].",
      "",
      "The posting emphasizes " + a + ", " + b + ", and " + c + ". I have used ... [one true example for each, with a number].",
      "I am also building strength in " + g1 + " and " + g2 + ". [One honest sentence about how you have used it, learned it, or would ramp up.]",
      "",
      "I would welcome the chance to discuss how I can help your team ... [one specific outcome you would own].",
      "",
      "Sincerely,",
      "[Your name]"
    ];

    var questions = [
      "Walk me through a project where you used " + a + ". What was the measurable outcome?",
      "The posting emphasizes " + g1 + ". How would you get up to speed, and what would you do in your first 30 days?",
      "Tell me about a time you solved a problem without " + g2 + ". How did you adapt?",
      "How would you explain " + b + " to a non-technical stakeholder?",
      "Describe a situation where " + g3 + " was the bottleneck. What did you change?",
      "What metric would you use to prove success in this " + role + " role?",
      "Tell me about a failure related to " + c + ". What did you change afterward?",
      "Why this role, and why now?"
    ];

    return { coverLetter: coverLetter, questions: questions, top: top, gaps: gaps };
  }

  function renderProPlaybook(report) {
    var p = proPlaybook(report);
    return '<section class="card pro-only pro-playbook" aria-labelledby="playbook-heading">' +
      '<div class="block-head"><h3 id="playbook-heading">Pro playbook</h3><span class="tiny mono muted">Built from this scan</span></div>' +
      '<p class="small muted">A cover-letter outline and interview prompts using the vocabulary from this scan. Replace the brackets with true examples — do not paste a keyword list.</p>' +
      '<div class="playbook-grid">' +
        '<div class="playbook-panel"><h4>Cover letter outline</h4><div class="cover-letter">' +
          p.coverLetter.map(function (line) {
            return line ? "<p>" + esc(line) + "</p>" : '<div style="height:7px"></div>';
          }).join("") +
        "</div></div>" +
        '<div class="playbook-panel"><h4>Interview questions</h4><ol class="interview-list">' +
          p.questions.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") +
        "</ol></div>" +
      "</div>" +
      '<p class="tiny muted" style="margin-top:14px">These are prompts, not scripts. The best answer is a true story with a number in it.</p>' +
    "</section>";
  }

  function render(report) {
    if (!report || report.error) {
      setStatus(report && report.error ? report.error : "Something went wrong. Try again.", true);
      return;
    }
    lastReport = report;
    lastRole = roleEl.value;
    var shareBase = (cfg.siteUrl || window.location.origin + window.location.pathname).replace(/\/+$/, "");
    var shareUrl = shareBase + "/#checker";
    var shareText = "I scored " + report.score + "/100 (" + report.grade + ") on ResumeRadar — a free, private ATS resume checker. Target: " + report.roleName + ".";
    var linkedInShare = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(shareUrl);
    var xShare = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText) + "&url=" + encodeURIComponent(shareUrl);
    reportEl.hidden = false;
    reportEl.innerHTML =
      '<div class="report-grid">' +
        '<aside class="card score-card band-' + band(report.score) + '">' +
          '<div class="score-top">' +
            '<div class="score-ring" style="--pct:' + report.score + '" role="img" aria-label="ATS readiness score ' + report.score + ' out of 100">' +
              '<div style="text-align:center"><div class="score-num">' + report.score + '</div><div class="score-den">/ 100</div></div>' +
            "</div>" +
            '<div class="score-meta">' +
              '<div class="grade-badge" aria-label="Grade ' + report.grade + '">' + report.grade + "</div>" +
              "<h2>" + esc(scoreHeadline(report.score)) + "</h2>" +
              "<p>Target: " + esc(report.roleName) + " · scanned locally</p>" +
            "</div>" +
          "</div>" +
          '<p class="score-summary">' + esc(report.summary) + "</p>" +
          '<div class="category-list">' +
            report.categories.map(function (c) {
              return '<div class="category">' +
                '<div class="category-top"><span class="cat-label">' + esc(c.label) + '</span><span class="cat-score">' + c.score + "</span></div>" +
                '<div class="bar"><i style="width:' + c.score + '%"></i></div>' +
                '<span class="cat-note">' + esc(c.note) + "</span>" +
              "</div>";
            }).join("") +
          "</div>" +
          '<div class="score-foot"><span>' + report.structure.wordCount + " words · " + report.structure.bulletCount + " bullets</span>" +
          '<span class="grade-key">A 85+ · B 75+ · C 65+</span></div>' +
        "</aside>" +
        '<div class="report-main">' +
          '<div id="pro-access-slot"></div>' +
          renderKeywords(report) +
          renderFindings(report) +
          renderRoleChecklist(report) +
          renderProPlaybook(report) +
          '<div class="pro-banner free-only">' +
            '<div><p class="eyebrow">Pro report</p>' +
            "<h3>Unlock the full role checklist and every fix.</h3>" +
            "<p>One payment, no subscription. Pro adds the complete role checklist, every missing keyword ranked by importance, all recommended fixes, a cover-letter outline, eight interview questions, and a text export. <a href=\"sample-report.html\">See a sample report →</a></p>" +
            '<div class="pro-feats"><span>Ranked keyword gaps</span><span>Full role checklist</span><span>Every recommended fix</span><span>Cover letter outline</span><span>Interview questions</span><span>TXT export</span></div>' +
            '<p class="small muted">14-day refund if the report does not work for you. <a href="terms.html">Details</a>.</p></div>' +
            '<button type="button" class="btn btn-lg" data-pay>Get Pro — ' + esc(cfg.priceLabel || "$9") + "</button>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="report-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-print>Print / save PDF</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-share>Share my score</button>' +
        '<span class="share-links"><a href="' + esc(linkedInShare) + '" target="_blank" rel="noopener">LinkedIn</a><a href="' + esc(xShare) + '" target="_blank" rel="noopener">X</a></span>' +
        '<button type="button" class="btn btn-primary btn-sm pro-only" data-export>Download full report (.txt)</button>' +
        '<button type="button" class="btn btn-primary btn-sm free-only" data-unlock>Unlock full report — ' + esc(cfg.priceLabel || "$9") + "</button>" +
        '<span class="spacer"></span><span class="small">' + esc(report.jobKeywordCount) + " job terms detected</span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-clear>Scan another version</button>' +
      "</div>";

    mountProAccess();
    setStatus("Report ready — score " + report.score + " out of 100.");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reportEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function runScan() {
    var resume = resumeEl.value.trim();
    var job = jobEl.value.trim();
    if (countWords(resume) < 25) {
      setStatus("Add at least 25 words of resume text to run the scan.", true);
      resumeEl.focus();
      return;
    }
    var role = library.bySlug[roleEl.value] || null;
    setStatus("Scanning locally…");
    analyzeBtn.disabled = true;
    // Yield once so the button state paints before the synchronous scan.
    setTimeout(function () {
      try {
        var report = engine.analyze({ resume: resume, job: job, role: role });
        render(report);
      } catch (err) {
        setStatus("Could not read that text. Try pasting it as plain text.", true);
        if (window.console) console.error(err);
      } finally {
        analyzeBtn.disabled = false;
      }
    }, 40);
  }

  function loadSample() {
    resumeEl.value = SAMPLE_RESUME;
    jobEl.value = SAMPLE_JOB;
    roleEl.value = "software-engineer";
    updateCounts();
    setStatus("Sample loaded — scanning…");
    runScan();
  }

  function reset() {
    resumeEl.value = "";
    jobEl.value = "";
    updateCounts();
    reportEl.hidden = true;
    reportEl.innerHTML = "";
    lastReport = null;
    setStatus("");
    resumeEl.focus();
    document.getElementById("checker").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildExport(report) {
    var lines = [];
    lines.push("RESUMERADAR — ATS READINESS REPORT");
    lines.push("Generated: " + new Date().toLocaleString());
    lines.push("Target role: " + report.roleName);
    lines.push("Overall score: " + report.score + "/100 (grade " + report.grade + ")");
    lines.push("");
    lines.push("CATEGORY SCORES");
    report.categories.forEach(function (c) { lines.push("- " + c.label + ": " + c.score + "/100 (" + c.weight + "% weight) — " + c.note); });
    lines.push("");
    lines.push("JOB KEYWORDS" + (report.keywords.jdCoverage != null ? " (" + report.keywords.jdCoverage + "% match)" : " (no job description)"));
    lines.push("Matched: " + (report.keywords.matched.map(function (m) { return m.display || m.term; }).join(", ") || "none"));
    lines.push("Missing: " + (report.keywords.missing.map(function (m) { return m.display || m.term; }).join(", ") || "none"));
    lines.push("");
    lines.push("ROLE CHECKLIST — " + report.roleName + " (" + report.keywords.roleCoverage + "% covered)");
    report.keywords.roleTerms.forEach(function (t) {
      lines.push((t.matched ? "[x] " : "[ ] ") + (t.display || t.term));
    });
    lines.push("");
    lines.push("FINDINGS");
    report.findings.forEach(function (f) {
      lines.push("[" + f.severity.toUpperCase() + "] " + f.title);
      lines.push("  " + f.detail);
      lines.push("  Fix: " + f.fix);
    });
    lines.push("");
    var playbook = proPlaybook(report);
    lines.push("PRO PLAYBOOK — COVER LETTER OUTLINE");
    playbook.coverLetter.forEach(function (line) { lines.push("  " + line); });
    lines.push("");
    lines.push("PRO PLAYBOOK — INTERVIEW QUESTIONS");
    playbook.questions.forEach(function (q, i) { lines.push("  " + (i + 1) + ". " + q); });
    lines.push("");
    lines.push("Generated by ResumeRadar. No guarantee of employment; always tailor your resume honestly.");
    return lines.join("\n");
  }

  function downloadReport() {
    if (!lastReport) return;
    if (window.RRPro && !window.RRPro.isPro()) {
      window.RRPro.open("Unlock Pro to download the full report.");
      return;
    }
    var blob = new Blob([buildExport(lastReport)], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "resumeradar-report-" + new Date().toISOString().slice(0, 10) + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function shareReport() {
    if (!lastReport) return;
    var base = (cfg.siteUrl || window.location.origin + window.location.pathname).replace(/\/+$/, "");
    var url = base + "/#checker";
    var text = "I scored " + lastReport.score + "/100 (" + lastReport.grade + ") on ResumeRadar — a free, private ATS resume checker. Target: " + lastReport.roleName + ".";
    var payload = { title: "My ResumeRadar score", text: text, url: url };

    if (navigator.share) {
      navigator.share(payload).catch(function () { /* user cancelled */ });
      return;
    }

    var copy = text + " See your gaps in 20 seconds: " + url;
    function done() {
      if (window.RRPro) window.RRPro.toast("Share text copied");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copy).then(done).catch(function () {
        if (window.RRPro) window.RRPro.toast("Select the address bar to copy the link");
      });
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = copy;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (err) { /* no-op */ }
    document.body.removeChild(ta);
  }

  function init() {
    if (!engine) { setStatus("Scoring engine failed to load.", true); return; }

    library.roles.forEach(function (role) {
      var opt = document.createElement("option");
      opt.value = role.slug;
      opt.textContent = role.title;
      roleEl.appendChild(opt);
    });

    var params = new URLSearchParams(window.location.search);
    var requested = params.get("role");
    if (requested && library.bySlug[requested]) {
      roleEl.value = requested;
      setStatus("Role preset: " + library.bySlug[requested].title + ". Paste your resume to begin.");
    }

    // The keyword extractor hands the posting over through sessionStorage so
    // the text never appears in a URL, referrer, or server log.
    try {
      var prefill = sessionStorage.getItem("rr_job_prefill");
      if (prefill) {
        sessionStorage.removeItem("rr_job_prefill");
        var data = JSON.parse(prefill);
        if (data && typeof data.job === "string" && countWords(data.job) >= 20) {
          jobEl.value = data.job;
          if (data.role && library.bySlug[data.role]) roleEl.value = data.role;
          setStatus("Job post loaded from the keyword extractor. Paste your resume, then analyze.");
        }
      }
    } catch (e) { /* private mode or malformed payload */ }

    updateCounts();
    resumeEl.addEventListener("input", updateCounts);
    jobEl.addEventListener("input", updateCounts);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runScan();
    });

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runScan();
      }
    });

    var sampleBtn = document.getElementById("sample-btn");
    if (sampleBtn) sampleBtn.addEventListener("click", loadSample);
    var heroSample = document.getElementById("hero-sample");
    if (heroSample) {
      heroSample.addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById("checker").scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(loadSample, 320);
      });
    }

    document.addEventListener("rr:pro", mountProAccess);

    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-print]");
      if (target) { window.print(); return; }
      target = e.target.closest("[data-export]");
      if (target) { downloadReport(); return; }
      target = e.target.closest("[data-share]");
      if (target) { shareReport(); return; }
      target = e.target.closest("[data-clear]");
      if (target) { reset(); return; }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
