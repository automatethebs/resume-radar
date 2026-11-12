#!/usr/bin/env node
/*
 * Submits every URL in site/sitemap.xml to IndexNow (Bing, Yandex, and
 * participating engines). Run after deploying:
 *
 *   npm run indexnow
 *
 * The host key file lives at site/<key>.txt and must be deployed first.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "site");
const keyFile = path.join(root, "INDEXNOW_KEY.txt");

if (!fs.existsSync(keyFile)) {
  console.error("Missing INDEXNOW_KEY.txt. Generate a key and site/<key>.txt first.");
  process.exit(1);
}

const key = fs.readFileSync(keyFile, "utf8").trim();
const keyLocationFile = path.join(siteDir, `${key}.txt`);
if (!fs.existsSync(keyLocationFile)) {
  console.error(`Missing ${path.relative(root, keyLocationFile)} — deploy it before submitting.`);
  process.exit(1);
}

const config = fs.readFileSync(path.join(siteDir, "assets/config.js"), "utf8");
const siteUrl = ((config.match(/siteUrl:\s*"([^"]+)"/) || [])[1] || "").replace(/\/+$/, "");
if (!/^https:\/\//.test(siteUrl)) {
  console.error("Could not read a valid siteUrl from site/assets/config.js");
  process.exit(1);
}

const sitemap = fs.readFileSync(path.join(siteDir, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urls.length) {
  console.error("No URLs found in site/sitemap.xml");
  process.exit(1);
}

const payload = {
  host: new URL(siteUrl).host,
  key,
  keyLocation: `${siteUrl}/${key}.txt`,
  urlList: urls
};

console.log(`Submitting ${urls.length} URLs to IndexNow for ${payload.host}…`);
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload)
});
const body = await response.text();
console.log(`IndexNow responded ${response.status}${body ? `: ${body}` : ""}`);
if (response.status >= 400) process.exit(1);
