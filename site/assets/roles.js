/*
 * ResumeRadar role library.
 * Each role powers (a) the role-specific keyword checklist on its landing page
 * and (b) the "recommended for this role" part of the score.
 * Keep terms lowercase; the matcher normalises everything anyway.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RR_ROLES = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ROLES = [
    {
      slug: "software-engineer",
      title: "Software Engineer",
      plural: "Software Engineers",
      focus: "shipping reliable code, system design, and cross-functional delivery",
      core: ["data structures", "algorithms", "system design", "api design", "microservices", "unit testing", "code review", "debugging", "performance optimization", "scalability", "object-oriented programming", "rest apis", "relational databases", "distributed systems"],
      tools: ["javascript", "typescript", "python", "java", "react", "node.js", "sql", "docker", "kubernetes", "aws", "postgresql", "redis", "graphql", "terraform", "github actions", "jenkins", "git"],
      verbs: ["built", "designed", "implemented", "optimized", "shipped", "refactored", "automated", "scaled", "debugged", "led"]
    },
    {
      slug: "data-analyst",
      title: "Data Analyst",
      plural: "Data Analysts",
      focus: "turning messy data into dashboards and decisions stakeholders trust",
      core: ["sql", "data cleaning", "data modeling", "statistics", "dashboards", "kpis", "a/b testing", "data visualization", "reporting", "etl", "stakeholder communication", "trend analysis", "cohort analysis", "forecasting"],
      tools: ["excel", "tableau", "power bi", "python", "pandas", "r", "snowflake", "bigquery", "looker", "dbt", "google analytics", "jupyter", "google sheets"],
      verbs: ["analyzed", "modeled", "visualized", "automated", "identified", "measured", "segmented", "forecasted", "reported", "partnered"]
    },
    {
      slug: "product-manager",
      title: "Product Manager",
      plural: "Product Managers",
      focus: "finding the right problem, prioritising the roadmap, and shipping outcomes",
      core: ["product strategy", "roadmap", "user research", "requirements", "user stories", "prioritization", "stakeholder management", "go-to-market", "kpis", "a/b testing", "agile", "scrum", "product analytics", "competitive analysis", "backlog grooming", "product discovery"],
      tools: ["jira", "confluence", "figma", "amplitude", "mixpanel", "sql", "google analytics", "notion", "linear", "miro"],
      verbs: ["launched", "prioritized", "defined", "drove", "aligned", "validated", "scoped", "partnered", "measured", "delivered"]
    },
    {
      slug: "project-manager",
      title: "Project Manager",
      plural: "Project Managers",
      focus: "keeping scope, budget, risk, and stakeholders moving in the same direction",
      core: ["project planning", "scope management", "risk management", "budget management", "resource allocation", "stakeholder communication", "timelines", "milestones", "change management", "vendor management", "agile", "waterfall", "status reporting", "dependency management", "pmp"],
      tools: ["ms project", "jira", "asana", "trello", "smartsheet", "excel", "confluence", "monday.com", "sharepoint"],
      verbs: ["delivered", "coordinated", "managed", "mitigated", "tracked", "negotiated", "planned", "escalated", "aligned", "launched"]
    },
    {
      slug: "registered-nurse",
      title: "Registered Nurse",
      plural: "Registered Nurses",
      focus: "safe patient care, accurate documentation, and calm interdisciplinary teamwork",
      core: ["patient care", "patient assessment", "medication administration", "vital signs", "care planning", "electronic health records", "infection control", "iv therapy", "wound care", "triage", "patient education", "bls", "acls", "hipaa", "interdisciplinary collaboration", "fall prevention"],
      tools: ["epic", "cerner", "meditech", "ehr", "pixis", "pyxis"],
      verbs: ["assessed", "administered", "monitored", "educated", "collaborated", "documented", "advocated", "triaged", "implemented", "coordinated"]
    },
    {
      slug: "teacher",
      title: "Teacher",
      plural: "Teachers",
      focus: "planning lessons that move every learner, and proving it with data",
      core: ["lesson planning", "classroom management", "differentiated instruction", "student assessment", "curriculum development", "iep", "common core", "data-driven instruction", "parent communication", "literacy", "stem", "formative assessment", "student engagement", "behavior management"],
      tools: ["google classroom", "canvas", "schoology", "smartboard", "nearpod", "kahoot", "ixl", "seesaw"],
      verbs: ["taught", "designed", "assessed", "differentiated", "mentored", "facilitated", "implemented", "improved", "collaborated", "analyzed"]
    },
    {
      slug: "sales-representative",
      title: "Sales Representative",
      plural: "Sales Representatives",
      focus: "building pipeline, hitting quota, and closing revenue that compounds",
      core: ["lead generation", "prospecting", "cold calling", "pipeline management", "quota attainment", "negotiation", "closing", "account management", "b2b sales", "saas", "upselling", "territory management", "sales forecasting", "discovery calls", "customer retention"],
      tools: ["salesforce", "hubspot", "outreach", "salesloft", "zoominfo", "linkedin sales navigator", "gong", "pipedrive"],
      verbs: ["exceeded", "closed", "prospected", "negotiated", "grew", "generated", "renewed", "expanded", "forecasted", "converted"]
    },
    {
      slug: "marketing-manager",
      title: "Marketing Manager",
      plural: "Marketing Managers",
      focus: "campaigns that produce qualified pipeline, not just impressions",
      core: ["campaign management", "seo", "sem", "content marketing", "email marketing", "social media", "conversion optimization", "marketing automation", "brand strategy", "budget management", "lead generation", "copywriting", "a/b testing", "marketing analytics", "audience segmentation"],
      tools: ["hubspot", "marketo", "mailchimp", "google ads", "meta ads", "semrush", "ahrefs", "canva", "ga4", "salesforce"],
      verbs: ["launched", "grew", "optimized", "managed", "increased", "drove", "tested", "positioned", "generated", "reduced"]
    },
    {
      slug: "accountant",
      title: "Accountant",
      plural: "Accountants",
      focus: "accurate books, clean closes, and reporting that survives an audit",
      core: ["general ledger", "accounts payable", "accounts receivable", "bank reconciliations", "month-end close", "financial reporting", "gaap", "journal entries", "variance analysis", "budgeting", "auditing", "tax preparation", "payroll", "internal controls", "financial statements"],
      tools: ["excel", "quickbooks", "netsuite", "sap", "oracle", "xero", "sage", "bill.com"],
      verbs: ["reconciled", "prepared", "audited", "analyzed", "closed", "ensured", "streamlined", "identified", "maintained", "reduced"]
    },
    {
      slug: "customer-service",
      title: "Customer Service Representative",
      plural: "Customer Service Representatives",
      focus: "resolving issues fast, protecting retention, and keeping CSAT high",
      core: ["customer support", "conflict resolution", "communication", "ticketing", "problem solving", "escalation", "customer satisfaction", "csat", "sla", "live chat", "call center", "retention", "onboarding", "active listening", "order processing"],
      tools: ["zendesk", "salesforce service cloud", "freshdesk", "intercom", "jira", "slack", "shopify"],
      verbs: ["resolved", "handled", "assisted", "escalated", "improved", "supported", "retained", "documented", "trained", "de-escalated"]
    },
    {
      slug: "mechanical-engineer",
      title: "Mechanical Engineer",
      plural: "Mechanical Engineers",
      focus: "designing parts and systems that are manufacturable, safe, and testable",
      core: ["cad", "mechanical design", "finite element analysis", "tolerances", "manufacturing", "prototyping", "thermodynamics", "fluid mechanics", "hvac", "lean manufacturing", "root cause analysis", "bill of materials", "iso 9001", "gd&t", "design for manufacturing"],
      tools: ["solidworks", "autocad", "ansys", "catia", "matlab", "creo", "fusion 360", "minitab"],
      verbs: ["designed", "tested", "prototyped", "optimized", "validated", "manufactured", "reduced", "specified", "troubleshot", "documented"]
    },
    {
      slug: "electrical-engineer",
      title: "Electrical Engineer",
      plural: "Electrical Engineers",
      focus: "circuits, embedded systems, and power designs that work in the field",
      core: ["circuit design", "pcb design", "embedded systems", "plc", "electrical schematics", "power distribution", "signal processing", "microcontrollers", "nec", "ul", "troubleshooting", "oscilloscope", "firmware", "control systems", "testing"],
      tools: ["altium", "eagle", "cadence", "labview", "matlab", "simulink", "arduino", "raspberry pi", "ltspice"],
      verbs: ["designed", "tested", "debugged", "integrated", "commissioned", "troubleshot", "validated", "automated", "reduced", "documented"]
    },
    {
      slug: "business-analyst",
      title: "Business Analyst",
      plural: "Business Analysts",
      focus: "turning fuzzy business problems into requirements, data, and shipped change",
      core: ["requirements gathering", "business requirements", "stakeholder management", "process improvement", "gap analysis", "sql", "data analysis", "use cases", "user stories", "uml", "bpmn", "agile", "uat", "documentation", "process mapping"],
      tools: ["jira", "confluence", "visio", "excel", "tableau", "power bi", "salesforce", "lucidchart", "sql server"],
      verbs: ["gathered", "analyzed", "documented", "streamlined", "translated", "identified", "facilitated", "validated", "mapped", "recommended"]
    },
    {
      slug: "ux-designer",
      title: "UX Designer",
      plural: "UX Designers",
      focus: "research-led design that measurably removes friction for users",
      core: ["user research", "wireframes", "prototypes", "usability testing", "interaction design", "information architecture", "design systems", "accessibility", "user flows", "personas", "journey mapping", "visual design", "wcag", "design thinking", "user interviews"],
      tools: ["figma", "sketch", "adobe xd", "invision", "miro", "maze", "hotjar", "user testing", "framer"],
      verbs: ["designed", "researched", "prototyped", "tested", "simplified", "collaborated", "reduced", "increased", "facilitated", "shipped"]
    },
    {
      slug: "devops-engineer",
      title: "DevOps Engineer",
      plural: "DevOps Engineers",
      focus: "automating delivery, keeping infrastructure boring, and cutting recovery time",
      core: ["ci/cd", "infrastructure as code", "kubernetes", "docker", "monitoring", "linux", "bash", "python", "incident response", "site reliability", "logging", "autoscaling", "security", "cloud architecture", "configuration management"],
      tools: ["aws", "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "prometheus", "grafana", "datadog", "splunk", "azure", "gcp"],
      verbs: ["automated", "deployed", "monitored", "scaled", "migrated", "secured", "reduced", "built", "maintained", "troubleshot"]
    },
    {
      slug: "cybersecurity-analyst",
      title: "Cybersecurity Analyst",
      plural: "Cybersecurity Analysts",
      focus: "detecting threats early, containing incidents, and closing the gaps attackers use",
      core: ["threat detection", "incident response", "siem", "vulnerability management", "penetration testing", "risk assessment", "firewall", "ids/ips", "malware analysis", "nist", "iso 27001", "soc 2", "security awareness", "encryption", "log analysis", "zero trust"],
      tools: ["splunk", "wireshark", "nessus", "burp suite", "crowdstrike", "sentinel", "qualys", "metasploit", "python"],
      verbs: ["detected", "investigated", "mitigated", "hardened", "monitored", "remediated", "assessed", "implemented", "reduced", "documented"]
    },
    {
      slug: "human-resources",
      title: "Human Resources Specialist",
      plural: "Human Resources Specialists",
      focus: "hiring, retaining, and supporting people without creating compliance risk",
      core: ["talent acquisition", "onboarding", "employee relations", "performance management", "benefits administration", "hris", "recruitment", "compliance", "fmla", "payroll", "training and development", "retention", "compensation", "hr policies", "employee engagement"],
      tools: ["workday", "bamboohr", "greenhouse", "lever", "adp", "paylocity", "linkedin recruiter", "excel"],
      verbs: ["recruited", "onboarded", "managed", "resolved", "implemented", "partnered", "reduced", "improved", "advised", "administered"]
    },
    {
      slug: "operations-manager",
      title: "Operations Manager",
      plural: "Operations Managers",
      focus: "removing waste, hitting service levels, and making the P&L work",
      core: ["process improvement", "inventory management", "supply chain", "p&l", "budgeting", "team leadership", "kpis", "vendor management", "lean", "six sigma", "logistics", "scheduling", "quality control", "forecasting", "cost reduction"],
      tools: ["sap", "oracle", "excel", "tableau", "salesforce", "netsuite", "power bi", "asana"],
      verbs: ["improved", "managed", "reduced", "streamlined", "led", "negotiated", "scaled", "standardized", "forecasted", "delivered"]
    },
    {
      slug: "pharmacist",
      title: "Pharmacist",
      plural: "Pharmacists",
      focus: "safe medication use, patient counseling, and airtight pharmacy operations",
      core: ["medication therapy management", "prescription verification", "patient counseling", "drug interactions", "compounding", "pharmacy operations", "inventory management", "immunizations", "prior authorization", "hipaa", "dea regulations", "clinical pharmacy", "pharmacotherapy", "mtm", "adherence"],
      tools: ["epic willow", "cerner", "qs/1", "rx30", "pioneerrx", "scriptpro"],
      verbs: ["dispensed", "counseled", "verified", "monitored", "collaborated", "ensured", "reviewed", "administered", "educated", "resolved"]
    },
    {
      slug: "graphic-designer",
      title: "Graphic Designer",
      plural: "Graphic Designers",
      focus: "visual systems that communicate clearly across print and screen",
      core: ["branding", "typography", "layout design", "print production", "digital design", "social media graphics", "motion graphics", "ui design", "visual identity", "color theory", "art direction", "prepress", "illustration", "creative direction"],
      tools: ["photoshop", "illustrator", "indesign", "figma", "after effects", "premiere pro", "canva", "lightroom"],
      verbs: ["designed", "created", "branded", "illustrated", "produced", "collaborated", "directed", "refreshed", "delivered", "concepted"]
    },
    {
      slug: "administrative-assistant",
      title: "Administrative Assistant",
      plural: "Administrative Assistants",
      focus: "keeping executives unblocked with airtight scheduling and follow-through",
      core: ["calendar management", "scheduling", "travel arrangements", "data entry", "filing", "office management", "customer service", "expense reports", "meeting minutes", "correspondence", "event planning", "document preparation", "invoicing", "inventory"],
      tools: ["microsoft office", "google workspace", "outlook", "excel", "word", "powerpoint", "quickbooks", "slack", "zoom"],
      verbs: ["scheduled", "organized", "coordinated", "maintained", "prepared", "supported", "managed", "processed", "arranged", "streamlined"]
    },
    {
      slug: "financial-analyst",
      title: "Financial Analyst",
      plural: "Financial Analysts",
      focus: "models, forecasts, and variance stories leadership can act on",
      core: ["financial modeling", "forecasting", "budgeting", "variance analysis", "valuation", "financial statements", "kpis", "scenario analysis", "reporting", "gaap", "cash flow", "profitability analysis", "cost analysis", "board reporting"],
      tools: ["excel", "sql", "tableau", "power bi", "sap", "oracle", "bloomberg", "netsuite", "python"],
      verbs: ["modeled", "forecasted", "analyzed", "reported", "improved", "evaluated", "automated", "identified", "partnered", "reduced"]
    },
    {
      slug: "supply-chain",
      title: "Supply Chain Specialist",
      plural: "Supply Chain Specialists",
      focus: "forecasting demand, sourcing reliably, and taking cost out of the chain",
      core: ["demand planning", "inventory management", "procurement", "logistics", "supplier management", "erp", "forecasting", "lean", "six sigma", "warehouse management", "transportation", "cost reduction", "s&op", "lead time", "vendor negotiation"],
      tools: ["sap", "oracle", "blue yonder", "excel", "tableau", "netsuite", "manhattan", "power bi"],
      verbs: ["optimized", "negotiated", "planned", "reduced", "coordinated", "sourced", "forecasted", "improved", "managed", "expedited"]
    },
    {
      slug: "civil-engineer",
      title: "Civil Engineer",
      plural: "Civil Engineers",
      focus: "designs that are buildable, permitted, and safe for decades",
      core: ["autocad", "civil 3d", "structural analysis", "site development", "grading", "drainage", "stormwater", "construction management", "project estimation", "surveying", "concrete", "steel design", "permitting", "gis", "earthwork"],
      tools: ["autocad civil 3d", "revit", "sap2000", "etabs", "arcgis", "hec-ras", "microstation", "bluebeam"],
      verbs: ["designed", "modeled", "inspected", "estimated", "coordinated", "permitted", "calculated", "reviewed", "managed", "delivered"]
    },
    {
      slug: "smart-contract-engineer",
      title: "Smart Contract Engineer",
      plural: "Smart Contract Engineers",
      focus: "writing upgrade-safe contracts that survive audits, gas limits, and real users",
      core: ["solidity", "evm", "smart contracts", "gas optimization", "security audits", "reentrancy", "access control", "upgradeability", "proxy patterns", "defi", "erc-20", "erc-721", "erc-1155", "oracles", "unit testing", "fuzzing", "formal verification", "on-chain governance", "layer 2", "account abstraction", "token standards", "merkle proofs", "foundry", "hardhat"],
      tools: ["solidity", "foundry", "hardhat", "typescript", "ethers.js", "viem", "openzeppelin", "chainlink", "the graph", "ipfs", "slither", "echidna", "tenderly", "github actions"],
      verbs: ["audited", "deployed", "optimized", "secured", "tested", "upgraded", "implemented", "reviewed", "reduced", "migrated"]
    },
    {
      slug: "blockchain-developer",
      title: "Blockchain Developer",
      plural: "Blockchain Developers",
      focus: "running reliable nodes, indexing chain data, and shipping infrastructure that does not drop",
      core: ["distributed systems", "consensus", "cryptography", "p2p networking", "layer 2", "rollups", "evm", "rpc", "indexing", "nodes", "block explorers", "bridges", "wallets", "transaction lifecycle", "gas estimation", "mempool", "finality", "data availability", "protocol engineering", "go", "rust"],
      tools: ["geth", "reth", "erigon", "docker", "kubernetes", "postgresql", "redis", "grafana", "prometheus", "terraform", "aws", "the graph", "substreams", "typescript", "go", "rust"],
      verbs: ["operated", "indexed", "deployed", "monitored", "scaled", "migrated", "optimized", "debugged", "automated", "built"]
    },
    {
      slug: "defi-analyst",
      title: "DeFi Analyst",
      plural: "DeFi Analysts",
      focus: "turning on-chain activity into risk, yield, and tokenomics decisions",
      core: ["on-chain analysis", "tokenomics", "liquidity", "yield farming", "risk assessment", "protocol revenue", "tvl", "defi", "stablecoins", "lending", "amm", "impermanent loss", "governance", "airdrop analysis", "wallet clustering", "mev", "smart contract risk", "financial modeling", "dashboards", "kpis"],
      tools: ["dune", "nansen", "defillama", "etherscan", "basescan", "sql", "python", "excel", "tableau", "metabase", "notion"],
      verbs: ["analyzed", "modeled", "tracked", "identified", "quantified", "reported", "monitored", "forecasted", "built", "automated"]
    },
    {
      slug: "web3-product-manager",
      title: "Web3 Product Manager",
      plural: "Web3 Product Managers",
      focus: "shipping wallet-native products without losing users at the signature screen",
      core: ["product strategy", "roadmap", "wallet ux", "tokenomics", "governance", "user research", "product discovery", "defi", "nfts", "account abstraction", "onboarding", "community", "incentive design", "protocol integrations", "security reviews", "compliance", "growth", "kpis", "a/b testing", "agile"],
      tools: ["jira", "notion", "figma", "dune", "snapshot", "mirror", "amplitude", "mixpanel", "linear", "github"],
      verbs: ["launched", "defined", "prioritized", "shipped", "partnered", "validated", "scoped", "grew", "aligned", "measured"]
    },
    {
      slug: "crypto-community-manager",
      title: "Crypto Community Manager",
      plural: "Crypto Community Managers",
      focus: "growing and moderating communities without turning them into a support queue",
      core: ["community management", "moderation", "discord", "telegram", "content strategy", "social media", "growth", "engagement", "event planning", "ambassador programs", "support", "crisis communication", "token incentives", "governance", "user feedback", "analytics", "copywriting", "partnerships"],
      tools: ["discord", "telegram", "x", "notion", "typeform", "zealy", "galxe", "buffer", "canva", "google analytics"],
      verbs: ["grew", "moderated", "launched", "engaged", "coordinated", "managed", "created", "supported", "partnered", "measured"]
    }
  ];

  var bySlug = {};
  ROLES.forEach(function (r) { bySlug[r.slug] = r; });

  return { roles: ROLES, bySlug: bySlug };
});
