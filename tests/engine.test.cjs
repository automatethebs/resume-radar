"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../site/assets/engine.js");
const { bySlug, roles } = require("../site/assets/roles.js");

const STRONG_RESUME = `Jordan Lee
Software Engineer
jordan.lee@example.com | (415) 555-0102 | linkedin.com/in/jordanlee | github.com/jordanlee

SUMMARY
Software engineer with 6 years of experience designing distributed systems, REST and GraphQL APIs, and cloud infrastructure on AWS. Reduced infrastructure cost 31% while scaling to 4 million monthly requests.

EXPERIENCE
Senior Software Engineer — Acme Cloud, San Francisco, CA
Jan 2021 – Present
• Designed and shipped a GraphQL API serving 4M requests per day, cutting p95 latency 42%.
• Migrated 18 microservices to Kubernetes on AWS with Terraform, reducing deploy time from 45 to 6 minutes.
• Built observability dashboards in Datadog and led incident response for 3 sev-1 events.
• Mentored 4 engineers and led code reviews for a 12-person team.
• Cut PostgreSQL query costs 27% by adding Redis caching and query tuning.

Software Engineer — Beta Labs, Austin, TX
Jun 2018 – Dec 2020
• Built React and TypeScript dashboards used by 9,000 customers.
• Automated CI/CD with GitHub Actions, increasing release frequency 3x.
• Wrote integration tests that reduced regression bugs 35%.

EDUCATION
B.S. Computer Science — University of Texas at Austin, 2018

SKILLS
JavaScript, TypeScript, Python, React, Node.js, GraphQL, REST APIs, PostgreSQL, Redis, AWS, Kubernetes, Docker, Terraform, CI/CD, Datadog, Microservices, Distributed Systems, System Design, Agile`;

const WEAK_RESUME = `Sam Taylor
sam@example.com

EXPERIENCE
Software Developer
Worked on various projects for the company.
Responsible for fixing bugs and helping with the website.
Helped with deployments and wrote some code.

EDUCATION
B.S. Computer Science`;

const JOB = `Senior Software Engineer — Cloud Platform

We are looking for a senior software engineer to design and ship reliable APIs, improve system performance, and work across teams.

Requirements
• Design, build, and operate REST and GraphQL APIs serving millions of requests per day
• Improve system scalability, reliability, and observability
• Write clean, tested TypeScript and Python
• Deploy services on AWS using Docker, Kubernetes, and Terraform
• Experience with PostgreSQL, Redis, and distributed systems
• Hands-on experience with CI/CD and microservices
• Familiarity with system design and performance optimization
• Excellent communication and collaboration skills

Nice to have
• Terraform, Datadog, and high-growth SaaS experience`;

test("strong resume beats weak resume by a wide margin", () => {
  const strong = engine.analyze({ resume: STRONG_RESUME, job: JOB, role: bySlug["software-engineer"] });
  const weak = engine.analyze({ resume: WEAK_RESUME, job: JOB, role: bySlug["software-engineer"] });
  assert.ok(strong.score >= 80, `expected strong >= 80, got ${strong.score}`);
  assert.ok(weak.score <= 55, `expected weak <= 55, got ${weak.score}`);
  assert.ok(strong.score - weak.score >= 25, "strong should beat weak by at least 25 points");
});

test("job keywords are extracted and ranked", () => {
  const report = engine.analyze({ resume: STRONG_RESUME, job: JOB, role: bySlug["software-engineer"] });
  const terms = report.keywords.matched.concat(report.keywords.missing).map((k) => k.term);
  assert.ok(terms.includes("kubernetes"), "kubernetes should be a keyword");
  assert.ok(terms.includes("graphql"), "graphql should be a keyword");
  assert.ok(report.jobKeywordCount >= 8, "should detect a useful number of terms");
  assert.ok(report.keywords.jdCoverage >= 70, `expected >= 70% coverage, got ${report.keywords.jdCoverage}%`);
});

test("synonyms and short forms receive credit", () => {
  const jd = "Requirements: JavaScript, PostgreSQL, Kubernetes, TypeScript, CI/CD";
  const resume = `Jordan Lee
jordan@example.com | (415) 555-0102 | linkedin.com/in/jordanlee

SUMMARY
Software engineer with six years of experience building web applications and APIs for growing teams. Comfortable owning delivery from design through production support.

SKILLS
JS, Postgres, k8s, TS, continuous integration. Built APIs with Node.

EXPERIENCE
Software Engineer — Acme, 2021 – Present
• Built APIs and shipped customer-facing features used by thousands of people.`;
  const report = engine.analyze({ resume, job: jd, role: null });
  assert.ok(report.keywords.jdCoverage >= 90, `expected synonym coverage >= 90, got ${report.keywords.jdCoverage}%`);
  assert.equal(report.keywords.missing.length, 0);
});

test("role-only mode works without a job description", () => {
  const report = engine.analyze({ resume: STRONG_RESUME, job: "", role: bySlug["software-engineer"] });
  assert.equal(report.keywords.jdCoverage, null);
  assert.ok(report.keywords.roleCoverage >= 70, `role coverage ${report.keywords.roleCoverage}%`);
  assert.ok(report.score >= 70, `score ${report.score}`);
});

test("missing contact details and dates are flagged", () => {
  const report = engine.analyze({ resume: WEAK_RESUME, job: JOB, role: bySlug["software-engineer"] });
  assert.equal(report.contact.phone, false);
  assert.equal(report.structure.hasDates, false);
  const titles = report.findings.map((f) => f.title.toLowerCase()).join(" | ");
  assert.match(titles, /contact|dates/);
});

test("quantified bullets raise the impact score", () => {
  const withMetrics = engine.analyze({ resume: STRONG_RESUME, role: bySlug["software-engineer"] });
  const noMetrics = engine.analyze({ resume: WEAK_RESUME, role: bySlug["software-engineer"] });
  assert.ok(withMetrics.impact.quantifiedRatio >= 40, `quantified ratio ${withMetrics.impact.quantifiedRatio}`);
  assert.ok(withMetrics.categories.find((c) => c.key === "impact").score > noMetrics.categories.find((c) => c.key === "impact").score);
});

test("short input returns a friendly error instead of a score", () => {
  const report = engine.analyze({ resume: "too short", job: JOB, role: bySlug["software-engineer"] });
  assert.ok(report.error);
  assert.equal(report.score, undefined);
});

test("scoring is deterministic", () => {
  const a = engine.analyze({ resume: STRONG_RESUME, job: JOB, role: bySlug["software-engineer"] });
  const b = engine.analyze({ resume: STRONG_RESUME, job: JOB, role: bySlug["software-engineer"] });
  assert.deepEqual(a, b);
});

test("all 39 role checklists are populated and unique", () => {
  assert.equal(roles.length, 39);
  assert.equal(new Set(roles.map((r) => r.slug)).size, 39);
  roles.forEach((role) => {
    assert.ok(role.core.length >= 10, `${role.slug} core too small`);
    assert.ok(role.tools.length >= 4, `${role.slug} tools too small`);
    assert.ok(role.verbs.length >= 8, `${role.slug} verbs too small`);
  });
});
