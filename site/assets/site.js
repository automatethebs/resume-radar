/*
 * Shared site behaviour: navigation, Pro unlock, USDC checkout, copy chips.
 * Dependency-free. Loaded on every page.
 */
(function () {
  "use strict";

  var cfg = window.RR_CONFIG || {};
  var STORAGE_KEY = "rr_pro_v1";
  var STORAGE_METHOD = "rr_pro_method";
  var STORAGE_REF = "rr_pro_ref";
  var USDC = cfg.usdc || {};
  var usdcActive = !!(USDC.enabled && USDC.address && USDC.contract);
  var demoActive = !cfg.paymentLink && !cfg.unlockCode && !usdcActive;
  var priceText = cfg.priceLabel || "$9";
  var assetBase = /\/roles\//.test(window.location.pathname) ? "../assets/" : "assets/";
  var QR_URL = assetBase + "usdc-qr.svg";
  var unlockDialog = null;
  var cryptoDialog = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function normalizeCode(code) {
    return String(code || "").trim().toUpperCase().replace(/[\s_-]+/g, "");
  }

  function supportHref() {
    if (cfg.supportUrl) return cfg.supportUrl;
    if (cfg.supportEmail) return "mailto:" + cfg.supportEmail;
    return "";
  }

  function supportLabel() {
    if (cfg.supportUrl) return "Open a support issue";
    return cfg.supportEmail || "support";
  }

  function isPro() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; }
  }

  function applyPro() {
    if (isPro()) document.body.classList.add("is-pro");
  }

  function announcePro() {
    applyPro();
    document.dispatchEvent(new CustomEvent("rr:pro"));
  }

  function grantPro(method, ref) {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      if (method) localStorage.setItem(STORAGE_METHOD, method);
      if (ref) localStorage.setItem(STORAGE_REF, ref);
    } catch (e) { /* private mode */ }
    announcePro();
  }

  function validCode(code) {
    var entered = normalizeCode(code);
    if (!entered) return false;
    if (cfg.unlockCode && entered === normalizeCode(cfg.unlockCode)) return true;
    if (demoActive && cfg.demoUnlockCode && entered === normalizeCode(cfg.demoUnlockCode)) return true;
    return false;
  }

  function unlock(code) {
    if (!validCode(code)) return false;
    grantPro("code", normalizeCode(code));
    return true;
  }

  function usdcMessage(reason) {
    switch (reason) {
      case "invalid-hash":
        return "That doesn't look like a Base transaction hash.";
      case "not-found":
        return "No confirmed transaction found yet. Wait a minute and try again.";
      case "failed":
        return "That transaction failed on-chain, so no payment was made.";
      case "no-transfer":
        return "That transaction did not send at least " + (USDC.amount || "9") + " USDC on Base to this address.";
      case "rpc":
        return "Could not reach the Base network. Check your connection and try again.";
      default:
        return "Payment could not be verified. Try again or contact support.";
    }
  }

  /* Toast ---------------------------------------------------------------- */
  var toastEl = null;
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  /* Dialogs -------------------------------------------------------------- */
  function showDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      try { dialog.showModal(); } catch (e) { dialog.setAttribute("open", ""); }
    } else {
      dialog.setAttribute("open", "");
    }
    setTimeout(function () {
      var input = dialog.querySelector("input");
      if (input) input.focus();
    }, 30);
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function bindDialog(dialog) {
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target.hasAttribute("data-close")) closeDialog(dialog);
    });
  }

  function supportFoot() {
    var href = supportHref();
    if (!href) return "";
    return '<p class="dialog-foot">Need help? <a href="' + esc(href) + '" target="_blank" rel="noopener">' +
      esc(supportLabel()) + "</a>.</p>";
  }

  function buildUnlockDialog() {
    if (unlockDialog) return unlockDialog;
    unlockDialog = document.createElement("dialog");
    unlockDialog.id = "unlock-dialog";
    unlockDialog.setAttribute("aria-labelledby", "unlock-title");

    var demo = "";
    if (demoActive && cfg.demoUnlockCode) {
      demo = '<div class="demo-hint">Demo mode — payments are not configured yet. ' +
        "Use code <code>" + esc(cfg.demoUnlockCode) + "</code> to preview Pro. " +
        "Set <code>paymentLink</code> or enable USDC in assets/config.js to go live.</div>";
    }

    var payButtons = "";
    if (cfg.paymentLink) {
      payButtons += '<button type="button" class="btn btn-ghost btn-sm" data-pay>Buy with card — ' + esc(priceText) + "</button>";
    }
    if (usdcActive) {
      payButtons += '<button type="button" class="btn btn-ghost btn-sm" data-crypto>Pay or restore with USDC — ' + esc(priceText) + "</button>";
    }
    var payRow = payButtons
      ? '<div class="dialog-pay"><span>Need Pro?</span>' + payButtons + "</div>"
      : "";

    unlockDialog.innerHTML =
      '<div class="dialog-body">' +
        '<button type="button" class="dialog-close" data-close aria-label="Close">×</button>' +
        '<p class="eyebrow">Pro access</p>' +
        '<h2 id="unlock-title">Unlock the full report</h2>' +
        '<p>Enter the license code from a card purchase, or the Base transaction hash from a USDC payment. Both are checked on this device.</p>' +
        '<form class="dialog-form" id="unlock-form" novalidate>' +
          '<label for="unlock-code">License code or transaction hash</label>' +
          '<input id="unlock-code" name="code" class="mono" autocomplete="off" spellcheck="false" placeholder="RR-XXXX-XXXX or 0x...">' +
          '<p class="dialog-msg" id="unlock-msg" role="alert"></p>' +
          '<button class="btn btn-primary" type="submit">Unlock Pro</button>' +
        "</form>" +
        payRow +
        supportFoot() +
        demo +
      "</div>";
    document.body.appendChild(unlockDialog);
    bindDialog(unlockDialog);

    var form = $("#unlock-form", unlockDialog);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#unlock-code", unlockDialog);
      var msg = $("#unlock-msg", unlockDialog);
      var value = input.value.trim();
      if (!value) {
        msg.textContent = "Enter a license code or transaction hash.";
        input.focus();
        return;
      }

      var hash = window.RRPay && usdcActive ? window.RRPay.parseTxHash(value) : "";
      if (hash) {
        checkUsdc(hash, msg, form.querySelector('button[type="submit"]'), "Unlock Pro", function () {
          closeDialog(unlockDialog);
          toast("Payment verified — Pro unlocked");
        });
        return;
      }

      if (unlock(value)) {
        msg.textContent = "";
        closeDialog(unlockDialog);
        toast("Pro unlocked on this device");
      } else {
        msg.textContent = "That code was not recognised. Check your confirmation email.";
        input.focus();
        input.select();
      }
    });

    return unlockDialog;
  }

  function buildCryptoDialog() {
    if (cryptoDialog) return cryptoDialog;
    cryptoDialog = document.createElement("dialog");
    cryptoDialog.id = "crypto-dialog";
    cryptoDialog.setAttribute("aria-labelledby", "crypto-title");

    var explorerRoot = String(USDC.explorer || "https://basescan.org").replace(/\/tx\/?$/, "");
    var units = window.RRPay ? window.RRPay.amountToUnits(USDC.amount || "9", USDC.decimals == null ? 6 : USDC.decimals) : null;
    var walletUri = units === null ? "" :
      "ethereum:" + USDC.contract + "@" + (USDC.chainId || 8453) +
      "/transfer?address=" + USDC.address + "&uint256=" + units.toString();
    cryptoDialog.innerHTML =
      '<div class="dialog-body">' +
        '<button type="button" class="dialog-close" data-close aria-label="Close">×</button>' +
        '<p class="eyebrow">USDC on Base</p>' +
        '<h2 id="crypto-title">Pay ' + esc(priceText) + " in USDC</h2>" +
        '<p>Send <strong>' + esc(USDC.amount || "9") + " USDC</strong> on the <strong>Base</strong> network to the address below. Then paste the transaction hash to unlock Pro on this device.</p>" +
        '<div class="crypto-box">' +
          '<img class="crypto-qr" src="' + esc(QR_URL) + '" alt="QR code for the ResumeRadar USDC payment address" width="132" height="132">' +
          '<div class="crypto-detail">' +
            '<span class="crypto-label">USDC address · Base</span>' +
            '<code class="crypto-address">' + esc(USDC.address) + "</code>" +
            '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(USDC.address) + '">Copy address</button>' +
            (walletUri ? '<a class="btn btn-ghost btn-sm" href="' + esc(walletUri) + '">Open in wallet</a>' : "") +
          "</div>" +
        "</div>" +
        '<p class="crypto-warn">Base network only. USDC sent on another network cannot be recovered here. Gas is paid separately.</p>' +
        '<form class="dialog-form" id="crypto-form" novalidate>' +
          '<label for="crypto-tx">Base transaction hash</label>' +
          '<input id="crypto-tx" name="tx" class="mono" autocomplete="off" spellcheck="false" placeholder="0x...">' +
          '<p class="dialog-msg" id="crypto-msg" role="alert"></p>' +
          '<button class="btn btn-primary" type="submit">Verify payment</button>' +
        "</form>" +
        '<p class="dialog-foot">Find the hash in your wallet or on <a href="' + esc(explorerRoot) + '" target="_blank" rel="noopener">BaseScan</a>. ' +
          '<button type="button" class="linklike" data-unlock>Use a license code instead</button></p>' +
      "</div>";
    document.body.appendChild(cryptoDialog);
    bindDialog(cryptoDialog);

    var form = $("#crypto-form", cryptoDialog);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#crypto-tx", cryptoDialog);
      var msg = $("#crypto-msg", cryptoDialog);
      var value = input.value.trim();
      if (!value) {
        msg.textContent = "Paste the transaction hash from your payment.";
        input.focus();
        return;
      }
      checkUsdc(value, msg, form.querySelector('button[type="submit"]'), "Verify payment", function () {
        closeDialog(cryptoDialog);
        toast("Payment verified — Pro unlocked");
      });
    });

    return cryptoDialog;
  }

  async function checkUsdc(hash, msgEl, button, idleLabel, onSuccess) {
    if (!window.RRPay) {
      msgEl.textContent = "Payment verification failed to load. Refresh the page and try again.";
      return;
    }
    if (!window.RRPay.parseTxHash(hash)) {
      msgEl.textContent = usdcMessage("invalid-hash");
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = "Checking the chain…";
    }
    msgEl.textContent = "";
    try {
      var result = await window.RRPay.verifyUsdcTx(hash, USDC);
      if (result.ok) {
        grantPro("usdc", result.txHash);
        onSuccess(result);
        return;
      }
      msgEl.textContent = usdcMessage(result.reason);
    } catch (err) {
      msgEl.textContent = usdcMessage("rpc");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = idleLabel;
      }
    }
  }

  function openUnlock(message) {
    buildUnlockDialog();
    closeDialog(cryptoDialog);
    var msg = $("#unlock-msg", unlockDialog);
    if (msg) msg.textContent = message || "";
    showDialog(unlockDialog);
  }

  function openCrypto(message) {
    buildCryptoDialog();
    closeDialog(unlockDialog);
    var msg = $("#crypto-msg", cryptoDialog);
    if (msg) msg.textContent = message || "";
    showDialog(cryptoDialog);
  }

  function goToPayment() {
    if (cfg.paymentLink) {
      window.location.href = cfg.paymentLink;
      return;
    }
    if (usdcActive) {
      openCrypto();
      return;
    }
    openUnlock(demoActive ? "Demo mode: use the code below to preview Pro." : "Payments are not configured yet.");
  }

  /* URL unlock (Stripe success redirect or USDC return) ------------------ */
  function cleanParams(keys) {
    var params = new URLSearchParams(window.location.search);
    keys.forEach(function (key) { params.delete(key); });
    var qs = params.toString();
    var clean = window.location.pathname + (qs ? "?" + qs : "") + window.location.hash;
    if (window.history && window.history.replaceState) window.history.replaceState({}, "", clean);
  }

  function handleUrlCode() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get("unlock");
    var tx = params.get("tx");

    if (code) {
      if (unlock(code)) {
        toast("Pro unlocked — thank you");
        cleanParams(["unlock"]);
      } else {
        openUnlock("That unlock link was not recognised. Paste your code below.");
      }
      return;
    }

    if (tx && usdcActive) {
      openCrypto();
      var input = $("#crypto-tx", cryptoDialog);
      if (input) input.value = window.RRPay ? window.RRPay.parseTxHash(tx) || tx : tx;
      cleanParams(["tx"]);
    }
  }

  /* Copy chips ----------------------------------------------------------- */
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

  function bindCopy() {
    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-copy]");
      if (!el) return;
      var value = el.getAttribute("data-copy");
      if (!value) return;
      copyText(value).then(function () {
        toast('Copied "' + value + '"');
      }).catch(function () {
        toast("Could not copy — select the text manually");
      });
    });
  }

  /* Nav ------------------------------------------------------------------ */
  function bindNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Payment copy --------------------------------------------------------- */
  function paymentNote() {
    if (cfg.paymentLink) return "Secure card checkout. Card details never touch this site.";
    if (usdcActive) return "Pay " + priceText + " in USDC on Base. No account, no card, no subscription.";
    return "Demo mode — payments are not configured yet.";
  }

  /* Optional analytics --------------------------------------------------- */
  function analytics() {
    if (!cfg.analyticsDomain) return;
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://plausible.io/js/script.js";
    s.setAttribute("data-domain", cfg.analyticsDomain);
    document.head.appendChild(s);
  }

  function init() {
    applyPro();
    bindNav();
    bindCopy();

    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    $$("[data-price]").forEach(function (el) { el.textContent = priceText; });
    $$("[data-payment-note]").forEach(function (el) { el.textContent = paymentNote(); });

    var href = supportHref();
    if (href) {
      $$("[data-support]").forEach(function (el) {
        el.setAttribute("href", href);
        if (cfg.supportUrl) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
      });
    }
    if (cfg.supportEmail) {
      $$("[data-email]").forEach(function (el) {
        el.textContent = cfg.supportEmail;
        el.setAttribute("href", "mailto:" + cfg.supportEmail);
      });
    }

    // Delegated so buttons inside dynamically rendered reports work too.
    document.addEventListener("click", function (e) {
      var pay = e.target.closest("[data-pay]");
      if (pay) { e.preventDefault(); goToPayment(); return; }
      var unlockBtn = e.target.closest("[data-unlock]");
      if (unlockBtn) { e.preventDefault(); openUnlock(); return; }
      var cryptoBtn = e.target.closest("[data-crypto]");
      if (cryptoBtn) { e.preventDefault(); openCrypto(); }
    });

    handleUrlCode();
    analytics();
  }

  window.RRPro = {
    isPro: isPro,
    unlock: unlock,
    open: openUnlock,
    openCrypto: openCrypto,
    toast: toast
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
