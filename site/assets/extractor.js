/*
 * ResumeRadar job-description keyword extractor.
 * Depends on: roles.js, engine.js, site.js (for copy-chip delegation)
 */
(function () {
  "use strict";

  var library = window.RR_ROLES || { roles: [], bySlug: {} };
  var engine = window.RREngine;

  var form = document.getElementById("extractor-form");
  var jobEl = document.getElementById("job-text");
  var roleEl = document.getElementById("extractor-role");
  var countEl = document.getElementById("job-text-count");
  var statusEl = document.getElementById("extract-status");
  var resultsEl = document.getElementById("keyword-results");
  var sampleBtn = document.getElementById("extractor-sample");

  var PREFILL_KEY = "rr_job_prefill";
  var MIN_WORDS = 20;

  var SAMPLE_JOB = [
    "Senior Product Operations Manager — Remote (US)",
    "",
    "We are looking for a product operations manager to own the systems that help our product and engineering teams ship faster. You will design scalable processes, run quarterly planning, and turn messy product data into dashboards the leadership team can trust.",
    "",
    "What you'll do",
    "• Own roadmap planning, cross-functional program management, and release operations for three product squads",
    "• Build dashboards and reports in Looker and SQL; define KPIs and track product analytics",
    "• Lead stakeholder communication across product, engineering, sales, and support",
    "• Improve processes for user research, product discovery, and backlog prioritization",
    "• Run retrospectives and document decisions in Notion and Confluence",
    "",
    "Requirements",
    "• 4+ years in product operations, program management, or a related role",
    "• Strong SQL, data modeling, and spreadsheet skills",
    "• Experience with Jira, Confluence, Notion, and Looker",
    "• Excellent written communication and stakeholder management",
    "• Comfort with ambiguity and rapid change",
    "",
    "Nice to have",
    "• Experience with A/B testing, product analytics, and go-to-market planning",
    "• Background in SaaS or high-growth startups"
  ].join("\n");

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function countWords(text) {
    var t = String(text || "").trim();
    return t ? t.split(/\s+/).length : 0;
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function updateCount() {
    if (countEl && jobEl) countEl.textContent = countWords(jobEl.value) + " words";
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  function toast(message) {
    if (window.RRPro && typeof window.RRPro.toast === "function") {
      window.RRPro.toast(message);
      return;
    }
    if (!toast.el) {
      toast.el = document.createElement("div");
      toast.el.className = "toast";
      toast.el.setAttribute("role", "status");
      document.body.appendChild(toast.el);
    }
    toast.el.textContent = message;
    toast.el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { toast.el.classList.remove("show"); }, 2400);
  }

  function chip(item) {
    return '<button type="button" class="chip" data-copy="' + esc(item.display) +
      '" data-weight="' + esc(item.label) + '" title="Click to copy">' +
      '<span class="dot"></span>' + esc(item.display) +
      '<span class="chip-rank">' + (item.importance >= 0.7 ? "high" : item.importance >= 0.4 ? "med" : "low") +
      "</span></button>";
  }

  function group(items) {
    return '<div class="chips">' + items.map(chip).join("") + "</div>";
  }

  function render(items, roleName) {
    if (!resultsEl) return;
    if (!items.length) {
      resultsEl.innerHTML =
        '<div class="extractor-result-head"><div><p class="eyebrow">No keywords found</p>' +
        '<h2>Try the full posting.</h2><p class="small muted">The extractor needs at least a few sentences of requirements or responsibilities. ' +
        'Include the complete post, not just the title.</p></div></div>';
      resultsEl.hidden = false;
      resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    var high = items.filter(function (item) { return item.importance >= 0.7; });
    var rest = items.filter(function (item) { return item.importance < 0.7; });
    if (!high.length) { high = items.slice(0, 5); rest = items.slice(5); }
    var copyAll = items.map(function (item) { return item.display; }).join("\n");
    var highLabel = high.length + (high.length === 1 ? " term" : " terms");

    resultsEl.innerHTML =
      '<div class="extractor-result-head">' +
        '<div>' +
          '<p class="eyebrow">Extracted keywords</p>' +
          '<h2>' + items.length + ' terms worth mirroring.</h2>' +
          '<p class="small muted">Ranked by how prominently this posting uses them. Click any term to copy it.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="copy-all-keywords">Copy all ' + items.length + '</button>' +
      '</div>' +
      '<div class="kw-summary">' +
        '<span class="kw-stat"><strong>' + items.length + '</strong> terms</span>' +
        '<span class="kw-stat"><strong>' + high.length + '</strong> high priority</span>' +
        '<span class="kw-stat">Role: <strong>' + esc(roleName) + '</strong></span>' +
      '</div>' +
      '<div class="extractor-group">' +
        '<h3>Start with these</h3>' +
        '<p class="extractor-group-note">' + highLabel + ' the posting leans on the hardest. Add only the ones you can defend.</p>' +
        group(high) +
      '</div>' +
      (rest.length ?
        '<div class="extractor-group">' +
          '<h3>Also worth including</h3>' +
          '<p class="extractor-group-note">Useful supporting vocabulary. Fold these into experience bullets when true.</p>' +
          group(rest) +
        '</div>' : '') +
      '<div class="extractor-next">' +
        '<div>' +
          '<h3>Now compare these with your resume.</h3>' +
          '<p class="small muted">The checker will reuse this posting, show which terms are missing, and score the gap. Your text stays in this browser.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-primary" id="scan-with-posting">Scan my resume against this post</button>' +
      '</div>';

    var copyAllBtn = document.getElementById("copy-all-keywords");
    if (copyAllBtn) {
      copyAllBtn.addEventListener("click", function () {
        copyText(copyAll).then(function () {
          toast("Copied " + items.length + " keywords");
        }).catch(function () {
          toast("Could not copy — select the chips manually");
        });
      });
    }

    var scanBtn = document.getElementById("scan-with-posting");
    if (scanBtn) {
      scanBtn.addEventListener("click", function () {
        var payload = { job: jobEl.value.trim(), role: roleEl.value || "" };
        try { sessionStorage.setItem(PREFILL_KEY, JSON.stringify(payload)); } catch (e) { /* private mode */ }
        window.location.href = "index.html#checker";
      });
    }

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function extract() {
    if (!engine || typeof engine.extractJdKeywords !== "function") {
      setStatus("The keyword engine could not load. Refresh the page and try again.", true);
      return;
    }
    var text = jobEl.value.trim();
    if (countWords(text) < MIN_WORDS) {
      setStatus("Paste at least " + MIN_WORDS + " words from the posting to extract keywords.", true);
      jobEl.focus();
      return;
    }

    var role = library.bySlug[roleEl.value] || null;
    var roleName = role ? role.title : "General / auto-detect";
    setStatus("Extracting locally…");

    setTimeout(function () {
      try {
        var items = engine.extractJdKeywords(text, role);
        render(items, roleName);
        setStatus(items.length ? items.length + " keywords extracted — nothing left this tab." : "No distinct keywords found in that text.");
      } catch (err) {
        setStatus("Could not read that posting. Try pasting it as plain text.", true);
        if (window.console) console.error(err);
      }
    }, 30);
  }

  function loadSample() {
    jobEl.value = SAMPLE_JOB;
    roleEl.value = "product-manager";
    updateCount();
    setStatus("Sample loaded — extracting…");
    extract();
  }

  function init() {
    if (!jobEl || !form) return;

    if (library.roles) {
      library.roles.forEach(function (role) {
        var opt = document.createElement("option");
        opt.value = role.slug;
        opt.textContent = role.title;
        roleEl.appendChild(opt);
      });
    }

    updateCount();
    jobEl.addEventListener("input", updateCount);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      extract();
    });

    if (sampleBtn) sampleBtn.addEventListener("click", loadSample);

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        extract();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
