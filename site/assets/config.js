/*
 * ResumeRadar — the only file you edit to change how the business runs.
 *
 * Payments work out of the box through USDC on Base, verified in the buyer's
 * browser against public RPC endpoints. No server and no API keys.
 *
 * To add card checkout later:
 *   1. Create a Stripe Payment Link for the Pro product.
 *   2. Set its confirmation page to:
 *      https://YOURDOMAIN/index.html?unlock=YOUR-CODE#checker
 *   3. Paste the link in paymentLink and the code in unlockCode.
 *   4. Reload. Card checkout becomes the primary button; USDC stays available.
 *
 * If you disable every payment rail, the site falls back to demo mode with
 * the code RADAR-DEMO so the Pro experience can still be previewed.
 */
window.RR_CONFIG = {
  siteName: "ResumeRadar",
  siteUrl: "https://automatethebs.github.io/resume-radar",
  priceLabel: "$9",
  priceNote: "one-time · no subscription",

  // Card checkout (optional). Leave empty to run on USDC only.
  paymentLink: "",
  unlockCode: "",

  // Demo fallback. Only valid when no payment rail is configured.
  demoUnlockCode: "RADAR-DEMO",

  // Support is handled through the public issue tracker so no inbox is exposed.
  supportUrl: "https://github.com/automatethebs/resume-radar/issues",
  supportEmail: "",
  analyticsDomain: "",

  // Self-custody USDC checkout on Base. The private key is in .secrets/ and is
  // intentionally excluded from git. See README.md before touching this.
  usdc: {
    enabled: true,
    address: "0xe46471279bF9514C7d1C86Af8DE1bA63845c5C86",
    chainName: "Base",
    chainId: 8453,
    contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    amount: "9",
    decimals: 6,
    explorer: "https://basescan.org/tx/",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
      "https://base-rpc.publicnode.com"
    ]
  }
};
