/*
 * ResumeRadar — client-side USDC payment verification.
 *
 * No server, no account, no API key. Given a Base transaction hash, this asks
 * a public RPC endpoint for the receipt and checks that it contains an ERC-20
 * Transfer of at least the configured USDC amount to the configured address.
 *
 * This is deliberately small enough to audit. It is not a substitute for a
 * payment processor: a static site cannot prove a payment to a third party,
 * but it can verify the on-chain facts for the buyer's own browser.
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RRPay = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // keccak256("Transfer(address,address,uint256)")
  var TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  function parseTxHash(value) {
    var raw = String(value || "").trim();
    var match = raw.match(/0x[0-9a-fA-F]{64}/);
    return match ? match[0].toLowerCase() : "";
  }

  function amountToUnits(amount, decimals) {
    var places = Number(decimals == null ? 6 : decimals);
    if (!Number.isInteger(places) || places < 0 || places > 36) return null;
    var text = String(amount == null ? "" : amount).trim();
    if (!/^\d+(\.\d+)?$/.test(text)) return null;
    var parts = text.split(".");
    var whole = parts[0] || "0";
    var fraction = (parts[1] || "").slice(0, places);
    fraction += "0".repeat(Math.max(0, places - fraction.length));
    try {
      return BigInt(whole + fraction);
    } catch (err) {
      return null;
    }
  }

  function paddedAddress(address) {
    return "0x" + "0".repeat(24) + String(address || "").toLowerCase().replace(/^0x/, "");
  }

  function findTransfer(receipt, opts) {
    var contract = String(opts.contract || "").toLowerCase();
    var recipient = String(opts.address || "").toLowerCase();
    var places = Number(opts.decimals == null ? 6 : opts.decimals);
    var minimum = amountToUnits(opts.amount, places);
    if (!contract || !recipient || minimum === null) return null;

    var logs = (receipt && receipt.logs) || [];
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i] || {};
      if (String(log.address || "").toLowerCase() !== contract) continue;
      var topics = log.topics || [];
      if (String(topics[0] || "").toLowerCase() !== TRANSFER_TOPIC) continue;
      if (String(topics[2] || "").toLowerCase() !== paddedAddress(recipient)) continue;

      var value;
      try {
        value = BigInt(log.data);
      } catch (err) {
        continue;
      }
      if (value < minimum) continue;

      return {
        from: "0x" + String(topics[1] || "").slice(-40),
        to: recipient,
        amountUnits: value.toString(),
        amount: Number(value) / Math.pow(10, places)
      };
    }
    return null;
  }

  function encodeErc20Transfer(to, amount, decimals) {
    var recipient = String(to || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) return "";
    var units = amountToUnits(amount, decimals == null ? 6 : decimals);
    if (units === null || units <= BigInt(0)) return "";
    var addressWord = recipient.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    var amountWord = units.toString(16).padStart(64, "0");
    return "0xa9059cbb" + addressWord + amountWord;
  }

  function verifyUsdcReceipt(receipt, opts) {
    if (!receipt) return { ok: false, reason: "not-found" };
    var status = receipt.status;
    if (status !== "0x1" && status !== "0x01" && status !== 1) {
      return { ok: false, reason: "failed" };
    }
    var transfer = findTransfer(receipt, opts || {});
    if (!transfer) return { ok: false, reason: "no-transfer" };
    return {
      ok: true,
      reason: "paid",
      txHash: receipt.transactionHash || "",
      from: transfer.from,
      to: transfer.to,
      amount: transfer.amount,
      amountUnits: transfer.amountUnits,
      blockNumber: receipt.blockNumber || ""
    };
  }

  async function verifyUsdcTx(hash, opts, fetchImpl) {
    var txHash = parseTxHash(hash);
    if (!txHash) return { ok: false, reason: "invalid-hash" };

    var urls = (opts && opts.rpcUrls) || [];
    var fetcher = fetchImpl || (typeof fetch === "function" ? fetch : null);
    if (!fetcher || !urls.length) return { ok: false, reason: "rpc" };

    var lastReason = "rpc";
    for (var i = 0; i < urls.length; i++) {
      try {
        var response = await fetcher(urls[i], {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getTransactionReceipt",
            params: [txHash]
          })
        });
        if (!response.ok) continue;
        var payload = await response.json();
        if (payload.error) continue;
        if (!payload.result) {
          lastReason = "not-found";
          continue;
        }
        var result = verifyUsdcReceipt(payload.result, opts);
        result.txHash = result.txHash || txHash;
        return result;
      } catch (err) {
        lastReason = "rpc";
      }
    }
    return { ok: false, reason: lastReason };
  }

  return {
    TRANSFER_TOPIC: TRANSFER_TOPIC,
    parseTxHash: parseTxHash,
    amountToUnits: amountToUnits,
    encodeErc20Transfer: encodeErc20Transfer,
    verifyUsdcReceipt: verifyUsdcReceipt,
    verifyUsdcTx: verifyUsdcTx
  };
});
