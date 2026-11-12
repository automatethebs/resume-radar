"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const pay = require("../site/assets/payments.js");

const CONFIG = {
  address: "0x716898c30A0A50A8336333586487cc7789Cd90e4",
  contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: "9",
  decimals: 6,
  rpcUrls: ["https://rpc-one.invalid", "https://rpc-two.invalid"]
};

const FROM = "0x1111111111111111111111111111111111111111";
const TO = CONFIG.address;

function topic(address) {
  return "0x" + "0".repeat(24) + address.toLowerCase().replace(/^0x/, "");
}

function transferReceipt({ to = TO, value = 9_000_000n, contract = CONFIG.contract, status = "0x1" } = {}) {
  return {
    status,
    transactionHash: "0x" + "a".repeat(64),
    blockNumber: "0x123",
    logs: [
      {
        address: contract,
        topics: [
          pay.TRANSFER_TOPIC,
          topic(FROM),
          topic(to)
        ],
        data: "0x" + value.toString(16).padStart(64, "0")
      }
    ]
  };
}

test("extracts a transaction hash from a pasted URL or raw value", () => {
  const hash = "0x" + "b".repeat(64);
  assert.equal(pay.parseTxHash(hash), hash);
  assert.equal(pay.parseTxHash(hash.toUpperCase().replace("0X", "0x")), hash);
  assert.equal(pay.parseTxHash(`https://basescan.org/tx/${hash}`), hash);
  assert.equal(pay.parseTxHash("not a hash"), "");
  assert.equal(pay.parseTxHash("0x1234"), "");
});

test("converts USDC amounts to 6-decimal units without floating point", () => {
  assert.equal(pay.amountToUnits("9", 6), 9_000_000n);
  assert.equal(pay.amountToUnits("9.5", 6), 9_500_000n);
  assert.equal(pay.amountToUnits("0.000001", 6), 1n);
  assert.equal(pay.amountToUnits("nope", 6), null);
});

test("accepts a confirmed USDC transfer for at least the price", () => {
  const result = pay.verifyUsdcReceipt(transferReceipt(), CONFIG);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "paid");
  assert.equal(result.amount, 9);
  assert.equal(result.to, TO.toLowerCase());
  assert.equal(result.from, FROM);
});

test("rejects underpayment, wrong recipient, wrong token, and failed transactions", () => {
  assert.equal(pay.verifyUsdcReceipt(transferReceipt({ value: 8_999_999n }), CONFIG).reason, "no-transfer");
  assert.equal(pay.verifyUsdcReceipt(transferReceipt({ to: FROM }), CONFIG).reason, "no-transfer");
  assert.equal(pay.verifyUsdcReceipt(transferReceipt({ contract: FROM }), CONFIG).reason, "no-transfer");
  assert.equal(pay.verifyUsdcReceipt(transferReceipt({ status: "0x0" }), CONFIG).reason, "failed");
  assert.equal(pay.verifyUsdcReceipt(null, CONFIG).reason, "not-found");
});

test("falls back to the next RPC endpoint and returns not-found for a null receipt", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("rpc-one")) return { ok: false, json: async () => ({}) };
    return { ok: true, json: async () => ({ jsonrpc: "2.0", id: 1, result: transferReceipt() }) };
  };
  const result = await pay.verifyUsdcTx("0x" + "c".repeat(64), CONFIG, fetchImpl);
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);

  const missing = await pay.verifyUsdcTx("0x" + "d".repeat(64), CONFIG, async () => ({
    ok: true,
    json: async () => ({ jsonrpc: "2.0", id: 1, result: null })
  }));
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "not-found");
});

test("rejects malformed hashes before making a network request", async () => {
  let touched = false;
  const result = await pay.verifyUsdcTx("nope", CONFIG, async () => {
    touched = true;
    return { ok: true, json: async () => ({}) };
  });
  assert.equal(result.reason, "invalid-hash");
  assert.equal(touched, false);
});
