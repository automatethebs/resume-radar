/*
 * ResumeRadar free summary generator.
 * Deterministic templates, no network, no storage of the entered text.
 */
(function () {
  "use strict";

  var library = window.RR_ROLES || { roles: [] };
  var form = document.getElementById("summary-form");
  var roleEl = document.getElementById("summary-role");
  var yearsEl = document.getElementById("summary-years");
  var skillsEl = document.getElementById("summary-skills");
  var resultEl = document.getElementById("summary-result");
  var outputEl = document.getElementById("summary-output");
  var current = [];

  if (!form || !roleEl || !outputEl) return;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function asSentence(value) {
    var text = clean(value);
    if (!text) return "";
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return /[.!?]$/.test(text) ? text : text + ".";
  }

  function roleBySlug(slug) {
    return library.roles.filter(function (role) { return role.slug === slug; })[0] || library.roles[0];
  }

  function skillsFor(role) {
    var typed = clean(skillsEl.value);
    if (typed) return typed;
    return role.core.slice(0, 3).join(", ");
  }

  function yearsFor() {
    var years = parseInt(yearsEl.value, 10);
    if (!isFinite(years) || years < 0) years = 0;
    if (years > 40) years = 40;
    return years;
  }

  function buildVariants(role, years, skills, result) {
    var resultSentence = asSentence(result) || '[add one measurable result, e.g. "cut cycle time 30%"].';
    var who = years > 0
      ? role.title + " with " + years + "+ years of experience in " + skills + "."
      : "Early-career " + role.title + " with hands-on experience in " + skills + ".";
    var strength = role.core[3] || role.core[0];
    var second = role.core[4] || role.core[1];

    return [
      who + " " + resultSentence + " Known for " + role.focus + ".",
      role.title + " with a track record across " + skills + ". " + resultSentence + " Strengths include " + role.core[0] + ", " + role.core[1] + ", and " + strength + ".",
      resultSentence + " " + who + " Looking for a role where " + strength + " and " + second + " matter."
    ];
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(area);
    });
  }

  function toast(message) {
    if (window.RRPro && typeof window.RRPro.toast === "function") {
      window.RRPro.toast(message);
    }
  }

  function render(variants) {
    current = variants;
    var labels = ["Results-first", "Scope-first", "Concise"];
    outputEl.textContent = "";
    variants.forEach(function (text, index) {
      var article = document.createElement("article");
      article.className = "summary-variant";

      var head = document.createElement("div");
      head.className = "summary-variant-head";
      var label = document.createElement("strong");
      label.textContent = labels[index] || "Variant " + (index + 1);
      var note = document.createElement("span");
      note.className = "tiny mono muted";
      note.textContent = text.split(/\s+/).length + " words";
      head.appendChild(label);
      head.appendChild(note);

      var body = document.createElement("p");
      body.textContent = text;

      var row = document.createElement("div");
      row.className = "copy-row";
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-ghost btn-sm";
      button.setAttribute("data-copy-summary", String(index));
      button.textContent = "Copy";
      row.appendChild(button);

      article.appendChild(head);
      article.appendChild(body);
      article.appendChild(row);
      outputEl.appendChild(article);
    });
    outputEl.hidden = false;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    outputEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function generate() {
    var role = roleBySlug(roleEl.value);
    if (!role) return;
    render(buildVariants(role, yearsFor(), skillsFor(role), resultEl.value));
  }

  roleEl.innerHTML = library.roles.map(function (role) {
    return '<option value="' + role.slug + '">' + role.title + "</option>";
  }).join("");

  roleEl.addEventListener("change", function () {
    var role = roleBySlug(roleEl.value);
    if (!role) return;
    skillsEl.placeholder = role.core.slice(0, 3).join(", ");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    generate();
  });

  document.addEventListener("click", function (event) {
    var copy = event.target.closest("[data-copy-summary]");
    if (copy) {
      var index = Number(copy.getAttribute("data-copy-summary"));
      var text = current[index];
      if (!text) return;
      copyText(text).then(function () {
        toast("Summary copied");
      }).catch(function () {
        toast("Could not copy — select the summary manually");
      });
      return;
    }

    var sample = event.target.closest("[data-summary-sample]");
    if (sample) {
      roleEl.value = "software-engineer";
      yearsEl.value = "6";
      skillsEl.value = "TypeScript, React, Node.js";
      resultEl.value = "cut deploy time from 45 to 8 minutes and increased checkout conversion 9%";
      generate();
    }
  });

  var initial = roleBySlug(roleEl.value);
  if (initial) skillsEl.placeholder = initial.core.slice(0, 3).join(", ");
})();