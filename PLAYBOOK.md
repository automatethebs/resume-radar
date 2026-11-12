# ResumeRadar Launch Playbook

The code is live. This is the part that turns a live site into revenue: distribution, conversion, and honest measurement.

## The pitch

> Stop guessing why your resume isn't getting callbacks. Paste it and a real job post. Get a private ATS score, the exact keywords you're missing, and the fixes — in 20 seconds, for $9 once.

The free scan is the marketing. The $9 Pro report is the product. There is no subscription, no account, and no upload.

## Unit economics

| Item | Value |
|---|---|
| Price | $9 one-time |
| Marginal cost per scan | $0 (browser-only JavaScript) |
| Hosting | $0 on GitHub Pages / Cloudflare Pages free tier |
| Payment fee (USDC on Base) | Network gas paid by buyer; no processor fee |
| Payment fee (Stripe, optional) | ~2.9% + $0.30 per transaction |
| Gross margin | ~97–100% |

At $9, this is an impulse purchase. The constraint is not margin; it is traffic and trust.

## Realistic revenue math

Assume 40% of visitors run a scan and 1–3% of scans convert to Pro.

| Monthly visitors | Scans | Pro sales at 1% | Revenue at 1% | Sales at 3% | Revenue at 3% |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 400 | 4 | $36 | 12 | $108 |
| 5,000 | 2,000 | 20 | $180 | 60 | $540 |
| 25,000 | 10,000 | 100 | $900 | 300 | $2,700 |
| 100,000 | 40,000 | 400 | $3,600 | 1,200 | $10,800 |

The first meaningful milestone is **100 visitors/day**. That is roughly 3,000/month, or 30 sales/month at a 1% scan-conversion rate. It is achievable with consistent community participation and long-tail SEO, but it will not happen from deploying alone.

## Before promoting

- [x] Site deployed and mobile-tested.
- [x] 24 role landing pages generated.
- [x] Sitemap, robots, canonicals, FAQ schema, Open Graph image.
- [x] USDC payment rail configured and tested.
- [x] Free scan, Pro unlock, TXT export.
- [x] Privacy policy and terms.
- [ ] Add Stripe Payment Link when card buyers ask (5 minutes; see README).
- [ ] Set `analyticsDomain` in `site/assets/config.js` after creating a Plausible account, or use Cloudflare Web Analytics.
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools (free accounts).
- [ ] Submit URLs through IndexNow after deployment.

## Channel plan, ranked by speed

### 1. Communities — first sales possible this week

Where the audience already asks for help:

- Reddit: `r/resumes`, `r/jobs`, `r/careerguidance`, `r/EngineeringResumes`, `r/cscareerquestions`, `r/nursing`, `r/Teachers`, `r/dataanalysis`, `r/ProductManagement`.
- Discord/Slack communities for bootcamps, career switchers, and university alumni.
- LinkedIn groups and comment sections of career coaches.

How to do it without being a spammer:

1. Spend 20–30 minutes a day answering posts that already describe resume problems.
2. Give a specific, useful critique in the comment — not "use my tool".
3. Mention the free checker only when it genuinely helps, and disclose that it is yours.
4. Never post the same link across five subreddits in one day.
5. Read each community's self-promotion rules; many require a minimum account age or a weekly promo thread.

A good comment:

> The biggest issue is probably the first bullet: "Responsible for frontend development" tells an ATS and a recruiter nothing searchable. Lead with the stack and a result — "Built a React/TypeScript checkout used by 12k monthly customers, cutting load time 34%." If you want a quick second pass, I built a free in-browser checker that compares your resume to the posting and shows the missing terms: [link]. No upload, no signup. Happy to look at the revised version either way.

### 2. SEO — compounding, slower

The site already has 24 role pages. They target queries such as:

- "ATS resume checker for nurses"
- "software engineer resume keywords"
- "data analyst resume skills"
- "teacher resume ATS"
- "project manager resume keywords"

Weekly cadence:

- Add 1–2 pages per week. Good next topics:
  - "ATS resume format: what actually parses in 2026"
  - "Why your resume isn't getting past the ATS"
  - "Resume keywords for career changers"
  - "Nurse resume skills and keywords"
  - "Free ATS checker vs Jobscan"
  - "How to tailor a resume in 4 minutes"
- Link new pages from `roles.html` and from related role pages.
- Update the `lastmod` date when content changes materially.
- Track impressions and queries in Search Console. Double down on pages that already get impressions but rank 8–20.
- Do not mass-generate thin city/role combinations. One useful page beats fifty doorway pages.

### 3. Short-form video — fastest cold reach

Three videos a week, 15–35 seconds, screen recording + voiceover. No face required.

Hooks:

- "I ran the same resume through an ATS checker twice. The second version got 22 points higher."
- "Your resume isn't rejected by a human. It's rejected by a keyword filter."
- "Recruiters search for exact phrases. Here are 12 for [role]."
- "This is the line in your resume that screams 'I have no metrics'."
- "Paste your resume here. It never leaves your browser."

Structure:

1. Hook (0–2s): the mistake.
2. Proof (3–15s): show the score and the missing keywords.
3. Fix (16–25s): show the rewrite.
4. CTA (26–30s): "Free scan, link in bio."

Post the same vertical video to TikTok, Instagram Reels, YouTube Shorts, and LinkedIn. Do not add watermarks from other platforms.

### 4. Launches — one-week spikes

- **Product Hunt:** create an upcoming page, prepare three gallery images, a 60-character tagline, and a first comment explaining why the resume never leaves the browser. Launch Tuesday–Thursday. Ask 10 people who have actually used it to comment, not just upvote.
- **Indie Hackers:** post a build/launch story with real numbers. The community responds to transparency, not polished ads.
- **Hacker News:** "Show HN: A private ATS resume checker that runs entirely in the browser." Only launch after the site is fast and mobile-perfect. HN will find edge cases.
- **Reddit launch posts:** use the subreddit's promo thread, not the main feed.

### 5. Partnerships

Who already has the audience:

- Career coaches and resume writers.
- Bootcamps and university career centers.
- Job-search newsletters and YouTube channels.
- Recruiting agencies that help candidates prepare.

Offer:

- 30% affiliate commission on each $9 sale (track with a unique Stripe code or a `?ref=` parameter and manual reconciliation).
- A free white-label report for their clients.
- A co-branded role guide.

Cold email template:

> Subject: A free ATS checker for your clients
>
> Hi [Name] — I built ResumeRadar, a private ATS checker that scores a resume against a real job post and shows the missing keywords. It runs entirely in the browser, so client resumes are never uploaded.
>
> Your clients can use the free scan without an account. If it is useful, I would like to set up a 30% affiliate code for your audience. Here is the sample report: [link].
>
> Worth a quick look?

### 6. Paid ads — only after conversion is proven

Do not start here. At $9, a $4 cost per acquisition leaves almost nothing.

When you have at least 2% scan-to-Pro conversion:

- Google Search exact match: "ATS resume checker", "resume keyword checker", "resume scanner free". Start at $10/day.
- Reddit Ads or LinkedIn Ads only if you have a strong creative and a landing page that converts.
- Kill any campaign with CAC above $3. Target CAC under $2.

## 14-day launch sprint

| Day | Action |
|---|---|
| 1 | Verify live site on desktop and mobile. Submit IndexNow. Create Search Console + Bing properties. |
| 2 | Answer 5 real resume questions in 2 communities. Post one LinkedIn tip. |
| 3 | Record and post 2 short videos. Add UTM links. |
| 4 | Publish one new SEO guide. Answer 5 more questions. |
| 5 | Post a value-first thread: "5 resume lines that fail the keyword filter". |
| 6 | Record 2 videos. Email 5 career coaches with the partnership template. |
| 7 | Review metrics. Fix the biggest drop-off. |
| 8 | Publish a role page for a niche with low competition. |
| 9 | Answer 5 questions. Post one before/after resume teardown. |
| 10 | Prepare Product Hunt assets and first comment. |
| 11 | Record 2 videos. Follow up with coaches. |
| 12 | Publish one comparison page ("free ATS checker vs paid tools"). |
| 13 | Launch on Product Hunt / Indie Hackers. |
| 14 | Review traffic sources, sales, and conversion. Double down on the one channel that produced scans. |

## 30-day content calendar

| Week | SEO | Social | Community | Launch / partnerships |
|---|---|---|---|---|
| 1 | 2 role pages | 6 short videos | 25 helpful comments | IndexNow, Search Console |
| 2 | 2 guides | 6 videos + 3 LinkedIn posts | 25 comments | 10 coach emails |
| 3 | 2 role pages | 6 videos | 25 comments | Product Hunt / IH |
| 4 | 2 guides | 6 videos | 25 comments | Review, double down |

## Hooks and scripts

### LinkedIn post

> A recruiter spends 6–8 seconds on your resume. An ATS spends milliseconds.
>
> The filter is often literal: if the posting says "observability" and your resume says "monitoring", you may never reach the human.
>
> I built a free checker that compares your resume to a real job post, shows the missing terms, and flags parser problems. It runs in your browser — the resume is never uploaded.
>
> No signup. No email. Link in the comments.

### Short video script

> "This resume says 'responsible for frontend development'. An ATS sees no stack, no scale, no outcome. Watch what happens when we add three specifics: React, 12,000 monthly users, 34% faster load. The score jumps 19 points. The free checker is in the bio — it never uploads your resume."

### Community comment

> The fix is usually not a complete rewrite. Take the top five requirements from the posting, find the exact phrases, and put the truthful ones in your most recent role's bullets. If you want to see which terms are missing, this free checker does it locally: [link]. No account, nothing uploaded.

## Conversion experiments

Run one at a time for at least 7 days or 200 scans.

1. **Price:** $9 vs $12 vs $7. At this price, $9 is the impulse anchor; $12 may raise revenue per sale without killing volume.
2. **Paywall placement:** top five missing keywords free (current) vs top three. More free value builds trust; less may convert better.
3. **CTA copy:** "Unlock the full report" vs "Show me every missing keyword". The second is more concrete.
4. **Social proof:** add real testimonials only after you have them. Do not invent them.
5. **Guarantee:** "If the report does not show you a useful gap, reply within 14 days for a refund." Reduces risk.
6. **Payment method:** add Stripe when buyers ask. Card conversion is usually much higher than crypto.

## Metrics to review weekly

- Visitors (by source)
- Scan starts
- Completed scans
- Report-to-Pro clicks
- Pro purchases
- Revenue
- Refund rate
- Top landing pages by impressions and by conversion
- Search queries with impressions but low CTR

Set `analyticsDomain` in `site/assets/config.js` to enable the optional Plausible script. If you prefer no third party, use Cloudflare Web Analytics or host logs.

## Guardrails

- Follow each community's self-promotion rules. Ban evasion and drive-by links are not a growth strategy.
- Never claim an ATS "guarantee", a specific interview rate, or that a score predicts hiring.
- Never fake testimonials, reviews, or user counts.
- Disclose affiliate and ownership relationships.
- Keep the privacy claim true: no resume upload, no account, no hidden analytics that captures text.
- For crypto payments, never ask for a seed phrase or private key. The site only needs a public transaction hash.
- Check your local tax and consumer-law obligations before scaling.

## The honest bottom line

The product is live and can accept money today. The remaining work is distribution. The highest-probability path with no budget is:

1. 2 weeks of genuinely helpful community participation.
2. 3 short videos per week.
3. 2 SEO pages per week for 8 weeks.
4. Add Stripe after the first few sales or when buyers ask for cards.

That is unglamorous, but it is how a $9 product becomes a real business instead of a deployed landing page.
