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
    var walletButton = (window.ethereum && typeof window.ethereum.request === "function" && window.RRPay && window.RRPay.encodeErc20Transfer)
      ? '<button type="button" class="btn btn-primary btn-block wallet-pay" data-wallet-pay>Pay ' + esc(priceText) + " from wallet</button>" +
        '<p class="wallet-note">Uses MetaMask, Coinbase Wallet, or another browser wallet. No account or email.</p>'
      : "";
    cryptoDialog.innerHTML =
      '<div class="dialog-body">' +
        '<button type="button" class="dialog-close" data-close aria-label="Close">×</button>' +
        '<p class="eyebrow">USDC on Base</p>' +
        '<h2 id="crypto-title">Pay ' + esc(priceText) + " in USDC</h2>" +
        '<p>Pay <strong>' + esc(USDC.amount || "9") + " USDC</strong> on the <strong>Base</strong> network from a browser wallet, or send manually to the address below. Verification happens on this device.</p>" +
        walletButton +
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

    var walletBtn = $("[data-wallet-pay]", cryptoDialog);
    if (walletBtn) {
      walletBtn.addEventListener("click", function () {
        payFromWallet($("#crypto-msg", cryptoDialog), walletBtn);
      });
    }

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

  function walletError(err) {
    if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) return "Payment cancelled in your wallet.";
    if (err && err.code === -32002) return "Your wallet already has a pending request. Open it and finish that request first.";
    return "Wallet payment could not be completed. Send USDC manually using the address below.";
  }

  async function payFromWallet(msgEl, button) {
    if (!window.RRPay || !window.RRPay.encodeErc20Transfer) {
      msgEl.textContent = "Wallet payment is unavailable. Send USDC manually using the address below.";
      return;
    }
    if (!window.ethereum || typeof window.ethereum.request !== "function") {
      msgEl.textContent = "No browser wallet detected. Send USDC manually using the address below, or open this page in a wallet browser.";
      return;
    }
    if (!USDC.rpcUrls || !USDC.rpcUrls.length) {
      msgEl.textContent = "Payment verification is not configured. Use a license code or contact support.";
      return;
    }

    var amount = USDC.amount || "9";
    var decimals = USDC.decimals == null ? 6 : USDC.decimals;
    var units = window.RRPay.amountToUnits(amount, decimals);
    var data = window.RRPay.encodeErc20Transfer(USDC.address, amount, decimals);
    if (units === null || !data) {
      msgEl.textContent = "The payment details are misconfigured. Use a license code or contact support.";
      return;
    }

    var idle = button.textContent;
    button.disabled = true;
    msgEl.textContent = "Confirm the payment in your wallet…";
    try {
      var accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      var from = accounts && accounts[0];
      if (!from) throw new Error("no-account");

      var chainHex = "0x" + Number(USDC.chainId || 8453).toString(16);
      var current = "";
      try { current = await window.ethereum.request({ method: "eth_chainId" }); } catch (e) { /* switch below */ }
      if (String(current || "").toLowerCase() !== chainHex.toLowerCase()) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
        } catch (switchErr) {
          if (switchErr && switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: chainHex,
                chainName: "Base",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: [String(USDC.explorer || "https://basescan.org").replace(/\/tx\/?$/, "")]
              }]
            });
            await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
          } else {
            throw switchErr;
          }
        }
      }

      var hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: from, to: USDC.contract, data: data, value: "0x0" }]
      });
      if (!hash) throw new Error("no-hash");

      msgEl.textContent = "Transaction sent. Waiting for confirmation…";
      button.textContent = "Waiting for confirmation…";

      for (var attempt = 0; attempt < 20; attempt++) {
        var result = await window.RRPay.verifyUsdcTx(hash, USDC);
        if (result.ok) {
          grantPro("usdc", result.txHash);
          closeDialog(cryptoDialog);
          toast("Payment verified — Pro unlocked");
          return;
        }
        if (result.reason === "failed") {
          msgEl.textContent = usdcMessage("failed");
          return;
        }
        await new Promise(function (resolve) { setTimeout(resolve, 3000); });
      }

      var input = $("#crypto-tx", cryptoDialog);
      if (input) input.value = hash;
      msgEl.textContent = "The transaction is taking longer than expected. Its hash is filled in below; verify again once it confirms.";
    } catch (err) {
      msgEl.textContent = walletError(err);
    } finally {
      button.disabled = false;
      button.textContent = idle;
    }
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
      var hash = window.RRPay ? window.RRPay.parseTxHash(tx) : "";
      if (!hash) {
        openCrypto("That restore link does not contain a valid Base transaction hash.");
        return;
      }
      if (isPro()) {
        cleanParams(["tx"]);
        toast("Pro is already unlocked on this device");
        return;
      }
      openCrypto("Restoring Pro from your payment…");
      var input = $("#crypto-tx", cryptoDialog);
      if (input) input.value = hash;
      var msg = $("#crypto-msg", cryptoDialog);
      checkUsdc(hash, msg, null, "", function () {
        closeDialog(cryptoDialog);
        cleanParams(["tx"]);
        toast("Payment verified — Pro restored");
      });
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
    $$("[data-usdc-address]").forEach(function (el) { if (USDC.address) el.textContent = USDC.address; });
    $$("[data-usdc-contract]").forEach(function (el) { if (USDC.contract) el.textContent = USDC.contract; });
    $$("[data-copy-usdc]").forEach(function (el) { if (USDC.address) el.setAttribute("data-copy", USDC.address); });
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

  function restoreUrl() {
    try {
      if (localStorage.getItem(STORAGE_METHOD) !== "usdc") return "";
      var ref = localStorage.getItem(STORAGE_REF);
      if (!ref || !/^0x[0-9a-fA-F]{64}$/.test(ref)) return "";
      return window.location.origin + window.location.pathname + "?tx=" + ref;
    } catch (e) {
      return "";
    }
  }

  window.RRPro = {
    isPro: isPro,
    unlock: unlock,
    open: openUnlock,
    openCrypto: openCrypto,
    restoreUrl: restoreUrl,
    toast: toast
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
