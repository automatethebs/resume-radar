/*
 * ResumeRadar free-template page controls.
 * Depends on: site.js (optional toast), the #resume-template element.
 */
(function () {
  "use strict";

  function templateText() {
    var el = document.getElementById("resume-template");
    return el ? el.textContent.replace(/\s+$/, "") + "\n" : "";
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

  document.addEventListener("click", function (e) {
    var copy = e.target.closest("[data-copy-template]");
    if (copy) {
      copyText(templateText()).then(function () {
        toast("ATS resume template copied");
      }).catch(function () {
        toast("Could not copy — select the template manually");
      });
      return;
    }

    var download = e.target.closest("[data-download-template]");
    if (download) {
      var blob = new Blob([templateText()], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ats-resume-template.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast("Template downloaded");
      return;
    }

    var print = e.target.closest("[data-print-template]");
    if (print) {
      window.print();
    }
  });
})();
