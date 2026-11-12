/*
 * ResumeRadar scoring engine.
 * Runs 100% in the browser. No network, no accounts, no AI API.
 * UMD wrapper so the same file powers the site and the Node test suite.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RREngine = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Vocabulary                                                          */
  /* ------------------------------------------------------------------ */

  var STOP = new Set((
    "a an the and or but if then than that this these those for with without from into onto over under about across " +
    "after before between during through during of to in on at by as is are was were be been being it its it's we our you your " +
    "they their he she his her them us i me my mine will would can could should may might must do does did done have has had " +
    "not no nor so such very more most much many any all each every other some own same only just also both either neither " +
    "who whom whose which what when where why how there here out up down off again further once because while until unless " +
    "per via etc eg ie plus including include includes included within across around among whether able ability"
  ).split(/\s+/));

  // Job-posting filler that should never become a "keyword".
  var GENERIC = new Set((
    "experience years year work working role position job company team teams candidate candidates applicant applicants " +
    "responsibilities responsibility requirements required require requires preferred nice must have has skills skill " +
    "knowledge understanding strong excellent good great new using use used ensure ensuring help helping support supporting " +
    "including etc plus benefits salary opportunity opportunities employer employee employees environment fast paced " +
    "full time part remote hybrid onsite office day days week weeks month months time professional motivated detail oriented " +
    "self starter passionate passion driven dedicated reliable organized excellent communication interpersonal " +
    "qualifications qualification degree field related equivalent minimum plus preferred ideal successful proven track record " +
    "join looking seeking apply application applicant candidates position available start immediately " +
    "apis senior junior entry level principal staff mid software engineer engineering"
  ).split(/\s+/));

  var ACTION_VERBS = new Set((
    "achieved accelerated acquired adapted administered advanced advised analyzed architected assessed audited authored " +
    "automated balanced benchmarked built boosted calculated calibrated coached collaborated collected compiled " +
    "commissioned communicated compared completed composed computed conducted configured consolidated constructed " +
    "consulted converted coordinated created cut defined delivered demonstrated deployed designed detected developed " +
    "diagnosed directed discovered documented doubled drove earned educated eliminated enabled engineered enhanced " +
    "established estimated evaluated examined executed expanded expedited facilitated forecasted formed founded generated " +
    "grew guided handled headed identified implemented improved increased influenced informed initiated inspected " +
    "installed instituted integrated introduced investigated launched led leveraged maintained managed mapped marketed " +
    "maximized measured mentored migrated minimized modeled modernized monitored negotiated onboarded operated optimized " +
    "orchestrated organized overhauled oversaw partnered performed piloted pioneered planned prepared presented prevented " +
    "prioritized processed produced programmed projected promoted prototyped provided published reduced refactored " +
    "reengineered regulated remediated reorganized reported researched resolved restructured retained reviewed revised " +
    "saved scaled scheduled secured segmented shipped simplified sourced spearheaded standardized streamlined strengthened " +
    "supervised supported tested trained transformed translated tripled troubleshot uncovered unified upgraded validated " +
    "verified visualized won wrote"
  ).split(/\s+/));

  var WEAK_PHRASES = [
    "responsible for", "duties included", "worked on", "helped with", "assisted with",
    "in charge of", "tasked with", "involved in", "participated in", "familiar with"
  ];

  var SYNONYM_GROUPS = [
    ["javascript", "js"], ["typescript", "ts"], ["python", "py"],
    ["node.js", "nodejs", "node js"], ["react", "react.js", "reactjs"],
    ["vue", "vue.js", "vuejs"], ["angular", "angular.js", "angularjs"],
    ["postgresql", "postgres", "psql"], ["kubernetes", "k8s"],
    ["amazon web services", "aws"], ["google cloud platform", "gcp", "google cloud"],
    ["microsoft azure", "azure"], ["continuous integration", "ci/cd", "cicd", "ci cd"],
    ["continuous delivery", "continuous deployment"],
    ["machine learning", "ml"], ["artificial intelligence", "ai"],
    ["search engine optimization", "seo"], ["search engine marketing", "sem"],
    ["customer relationship management", "crm"],
    ["human resources information system", "hris"],
    ["electronic health records", "ehr", "emr"],
    ["microsoft excel", "excel", "ms excel"], ["microsoft office", "ms office", "office suite"],
    ["structured query language", "sql"], ["rest apis", "rest api", "representational state transfer"],
    ["application programming interface", "api"], ["application programming interfaces", "apis"],
    ["project management professional", "pmp"], ["certified public accountant", "cpa"],
    ["user experience", "ux"], ["user interface", "ui"],
    ["quality assurance", "qa"], ["software as a service", "saas"],
    ["business to business", "b2b"], ["key performance indicators", "kpis"],
    ["return on investment", "roi"], ["generally accepted accounting principles", "gaap"],
    ["health insurance portability and accountability act", "hipaa"],
    ["master of business administration", "mba"], ["computer aided design", "cad"],
    ["finite element analysis", "fea"], ["computer numerical control", "cnc"],
    ["programmable logic controller", "plc"], ["printed circuit board", "pcb"],
    ["electronic data interchange", "edi"], ["salesforce.com", "salesforce"],
    ["google analytics 4", "ga4", "google analytics"], ["a/b testing", "ab testing", "split testing"],
    ["project management", "pm"], ["human resources", "hr"], ["customer service", "customer support"],
    ["user stories", "user story"], ["use cases", "use case"], ["financial statements", "financial statement"],
    ["accounts payable", "ap"], ["accounts receivable", "ar"], ["profit and loss", "p&l", "pnl"],
    ["powerpoint", "power point"], ["microsoft powerpoint", "powerpoint"],
    ["word", "microsoft word"], ["outlook", "microsoft outlook"]
  ];

  var RELATED_GROUPS = [
    ["agile", "scrum", "kanban", "sprint planning"],
    ["ci/cd", "continuous delivery", "continuous deployment", "jenkins", "github actions", "gitlab ci"],
    ["aws", "gcp", "azure", "cloud computing", "cloud architecture"],
    ["mysql", "postgresql", "sql server", "oracle database", "relational databases"],
    ["tableau", "power bi", "looker", "data visualization"],
    ["salesforce", "hubspot", "crm"],
    ["jira", "asana", "trello", "monday.com", "smartsheet"],
    ["seo", "content marketing", "keyword research"],
    ["recruiting", "talent acquisition", "sourcing"],
    ["accounts payable", "accounts receivable", "general ledger", "bookkeeping"],
    ["patient care", "patient assessment", "clinical care"],
    ["kpis", "metrics", "okrs"],
    ["etl", "data pipeline", "data integration"],
    ["microservices", "service-oriented architecture", "distributed systems"],
    ["unit testing", "test automation", "automated testing", "integration testing"],
    ["communication", "written communication", "verbal communication"],
    ["leadership", "team leadership", "people management"],
    ["budgeting", "budget management", "forecasting"],
    ["inventory management", "inventory control", "stock management"],
    ["process improvement", "continuous improvement", "lean", "six sigma"],
    ["user research", "usability testing", "user interviews"],
    ["incident response", "threat detection", "security operations"],
    ["financial modeling", "financial analysis", "valuation"],
    ["supply chain", "procurement", "logistics"],
    ["patient education", "patient counseling", "health education"],
    ["lesson planning", "curriculum development", "instructional design"]
  ];

  var GLOBAL_SKILLS = [    "communication", "leadership", "problem solving", "teamwork", "time management", "attention to detail",
    "project management", "data analysis", "customer service", "microsoft office", "excel", "sql",
    "stakeholder management", "cross-functional collaboration", "budget management", "process improvement",
    "presentation skills", "written communication", "critical thinking", "collaboration", "mentoring",
    "training", "reporting", "forecasting", "compliance", "risk management", "negotiation",
    // Cross-industry tools and technologies. Only counted when they appear in the posting.
    "javascript", "typescript", "python", "java", "c++", "c#", "php", "ruby", "golang", "rust",
    "swift", "kotlin", "scala", "html", "css", "react", "node.js", "angular", "vue", "next.js",
    "django", "flask", "spring boot", ".net", "graphql", "rest apis", "rest api", "microservices",
    "postgresql", "mysql", "sql server", "mongodb", "redis", "snowflake", "bigquery", "redshift",
    "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "ci/cd",
    "aws", "azure", "gcp", "google cloud", "linux", "bash", "prometheus", "grafana", "datadog", "splunk",
    "wireshark", "nessus", "burp suite", "git", "github", "jira", "confluence", "asana", "trello",
    "monday.com", "smartsheet", "notion", "figma", "sketch", "adobe xd", "invision", "miro", "hotjar",
    "photoshop", "illustrator", "indesign", "after effects", "premiere pro", "canva", "autocad",
    "solidworks", "revit", "matlab", "ansys", "labview", "plc", "pcb", "cad", "fea", "cnc", "hvac",
    "salesforce", "hubspot", "marketo", "mailchimp", "zendesk", "intercom", "freshdesk", "workday",
    "bamboohr", "greenhouse", "lever", "adp", "netsuite", "quickbooks", "xero", "sap", "oracle",
    "tableau", "power bi", "looker", "dbt", "pandas", "numpy", "jupyter", "spark", "hadoop", "kafka",
    "airflow", "postman", "selenium", "jest", "cypress", "playwright", "oauth", "jwt", "json", "xml",
    "google analytics", "ga4", "seo", "sem", "content marketing", "email marketing", "marketing automation",
    "crm", "erp", "hris", "etl", "data modeling", "data visualization", "machine learning",
    "artificial intelligence", "deep learning", "nlp", "a/b testing", "kpis", "okrs", "roi", "p&l",
    "financial modeling", "valuation", "gaap", "cpa", "pmp", "six sigma", "lean", "iso 9001", "osha",
    "hipaa", "bls", "acls", "ehr", "emr", "epic", "cerner", "meditech", "iep", "common core",
    "curriculum development", "lesson planning", "classroom management", "patent", "trademark",
    "supply chain", "procurement", "logistics", "inventory management", "warehouse management",
    "s&op", "demand planning", "gd&t", "lean manufacturing", "quality assurance", "quality control",
    "user research", "usability testing", "wireframes", "prototyping", "design systems", "accessibility",
    "wcag", "ux", "ui", "illustration", "typography", "branding", "print production", "motion graphics",
    "talent acquisition", "recruiting", "onboarding", "employee relations", "performance management",
    "benefits administration", "payroll", "compensation", "fmla", "incident response", "threat detection",
    "vulnerability management", "penetration testing", "siem", "firewall", "encryption", "zero trust",
    "nist", "iso 27001", "soc 2", "patient care", "patient assessment", "medication administration",
    "care planning", "triage", "wound care", "iv therapy", "pharmacotherapy", "mtm", "compounding",
    "underwriting", "loan processing", "accounts payable", "accounts receivable", "general ledger",
    "month-end close", "bank reconciliation", "journal entries", "auditing", "tax preparation",
    "financial statements", "variance analysis", "cash flow", "cost analysis", "contract negotiation",
    "vendor management", "change management", "scope management", "resource allocation", "risk assessment",
    "requirements gathering", "business requirements", "process mapping", "gap analysis", "user stories",
    "use cases", "uat", "bpmn", "uml", "roadmap", "product strategy", "go-to-market", "product analytics",
    "competitive analysis", "backlog grooming", "user interviews", "journey mapping", "personas",
    "information architecture", "interaction design", "visual design", "art direction", "prepress",
    "site development", "grading", "drainage", "stormwater", "structural analysis", "construction management",
    "project estimation", "surveying", "concrete", "steel design", "permitting", "gis", "earthwork",
    "circuit design", "pcb design", "embedded systems", "power distribution", "signal processing",
    "microcontrollers", "firmware", "control systems", "thermodynamics", "fluid mechanics", "gd&t",
    "prototyping", "root cause analysis", "bill of materials", "design for manufacturing",
    "calendar management", "travel arrangements", "data entry", "office management", "expense reports",
    "meeting minutes", "event planning", "invoicing", "correspondence", "executive support"
  ];

  /* Human-readable casing for extracted (lowercase) terms. */
  var DISPLAY_TERMS = {
    "javascript": "JavaScript", "typescript": "TypeScript", "node.js": "Node.js", "nodejs": "Node.js",
    "postgresql": "PostgreSQL", "graphql": "GraphQL", "sql": "SQL", "mysql": "MySQL", "mongodb": "MongoDB",
    "aws": "AWS", "gcp": "GCP", "api": "API", "apis": "APIs", "rest apis": "REST APIs", "rest api": "REST API",
    "ci/cd": "CI/CD", "cicd": "CI/CD", "html": "HTML", "css": "CSS", "ui": "UI", "ux": "UX", "qa": "QA",
    "seo": "SEO", "sem": "SEM", "crm": "CRM", "erp": "ERP", "hris": "HRIS", "saas": "SaaS", "b2b": "B2B",
    "kpi": "KPI", "kpis": "KPIs", "okr": "OKR", "okrs": "OKRs", "roi": "ROI", "p&l": "P&L", "gaap": "GAAP",
    "hipaa": "HIPAA", "ehr": "EHR", "emr": "EMR", "bls": "BLS", "acls": "ACLS", "iep": "IEP", "mba": "MBA",
    "pmp": "PMP", "cpa": "CPA", "etl": "ETL", "uat": "UAT", "bpmn": "BPMN", "uml": "UML", "gd&t": "GD&T",
    "iso 9001": "ISO 9001", "iso 27001": "ISO 27001", "soc 2": "SOC 2", "nist": "NIST", "osha": "OSHA",
    "plc": "PLC", "pcb": "PCB", "cad": "CAD", "fea": "FEA", "cnc": "CNC", "hvac": "HVAC", "gis": "GIS",
    "sap": "SAP", "adp": "ADP", "dbt": "dbt", "k8s": "K8s", "a/b testing": "A/B testing", "power bi": "Power BI",
    "sql server": "SQL Server", "google analytics": "Google Analytics", "ga4": "GA4",
    "github actions": "GitHub Actions", "gitlab ci": "GitLab CI", "salesforce": "Salesforce",
    "hubspot": "HubSpot", "quickbooks": "QuickBooks", "netsuite": "NetSuite", "workday": "Workday",
    "greenhouse": "Greenhouse", "bamboohr": "BambooHR", "zendesk": "Zendesk", "jira": "Jira",
    "confluence": "Confluence", "asana": "Asana", "trello": "Trello", "notion": "Notion", "figma": "Figma",
    "canva": "Canva", "autocad": "AutoCAD", "solidworks": "SolidWorks", "revit": "Revit",
    "matlab": "MATLAB", "ansys": "Ansys", "labview": "LabVIEW", "epic": "Epic", "cerner": "Cerner",
    "datadog": "Datadog", "kubernetes": "Kubernetes", "docker": "Docker", "terraform": "Terraform",
    "redis": "Redis", "jenkins": "Jenkins", "prometheus": "Prometheus", "grafana": "Grafana",
    "splunk": "Splunk", "wireshark": "Wireshark", "nessus": "Nessus", "linux": "Linux",
    "python": "Python", "react": "React", "vue": "Vue", "angular": "Angular", "django": "Django",
    "flask": "Flask", "spring boot": "Spring Boot", ".net": ".NET", "java": "Java", "ruby": "Ruby",
    "php": "PHP", "kotlin": "Kotlin", "swift": "Swift", "scala": "Scala", "rust": "Rust",
    "snowflake": "Snowflake", "bigquery": "BigQuery", "redshift": "Redshift", "looker": "Looker",
    "tableau": "Tableau", "pandas": "pandas", "numpy": "NumPy", "jupyter": "Jupyter", "spark": "Spark",
    "hadoop": "Hadoop", "kafka": "Kafka", "airflow": "Airflow", "postman": "Postman", "selenium": "Selenium",
    "jest": "Jest", "cypress": "Cypress", "playwright": "Playwright", "oauth": "OAuth", "jwt": "JWT",
    "json": "JSON", "xml": "XML", "rest": "REST", "microservices": "Microservices", "system design": "System Design",
    "data structures": "Data Structures", "algorithms": "Algorithms", "agile": "Agile", "scrum": "Scrum"
  };

  function prettyTerm(term) {
    var key = norm(term).trim();
    if (DISPLAY_TERMS[key]) return DISPLAY_TERMS[key];
    return key.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
  }

  var SYNONYMS = {};
  SYNONYM_GROUPS.forEach(function (group) {
    group.forEach(function (term) {
      var key = norm(term).trim();
      if (!key) return;
      if (!SYNONYMS[key]) SYNONYMS[key] = [];
      group.forEach(function (other) {
        if (other !== term) SYNONYMS[key].push(norm(other).trim());
      });
    });
  });

  var RELATED = {};
  RELATED_GROUPS.forEach(function (group) {
    group.forEach(function (term) {
      var key = norm(term).trim();
      if (!key) return;
      if (!RELATED[key]) RELATED[key] = [];
      group.forEach(function (other) {
        if (other !== term) RELATED[key].push(norm(other).trim());
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Text utilities                                                      */
  /* ------------------------------------------------------------------ */

  function norm(text) {
    return String(text == null ? "" : text)
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\r/g, "\n")
      .replace(/[^a-z0-9+#./'\-\s]/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function cleanToken(token) {
    return token.replace(/^[.'\-\/+#]+/, "").replace(/[.'\-\/+#]+$/, "");
  }

  function words(text) {
    var flat = norm(text).replace(/\n+/g, " ");
    if (!flat) return [];
    return flat.split(/\s+/).map(cleanToken).filter(function (w) { return w.length > 0; });
  }

  function stem(word) {
    var w = word;
    if (w.length <= 3) return w;
    if (/(ss|us|is)$/.test(w)) return w;
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /(ed)$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && /es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w)) return w.slice(0, -1);
    return w;
  }

  function pad(text) {
    return " " + norm(text).replace(/\n+/g, " ").replace(/\s+/g, " ").trim() + " ";
  }

  function buildIndex(text) {
    var flat = norm(text).replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    var toks = flat ? flat.split(" ").map(cleanToken).filter(Boolean) : [];
    var tokenSet = new Set(toks);
    var stemSet = new Set(toks.map(stem));
    return {
      flat: flat,
      padded: " " + flat + " ",
      tokens: tokenSet,
      stems: stemSet,
      wordCount: toks.length
    };
  }

  function escapeRe(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function phraseIn(index, phrase) {
    var p = norm(phrase).trim();
    if (!p) return false;
    if (index.padded.indexOf(" " + p + " ") !== -1) return true;
    // tolerate a line break turned into a space already
    var parts = p.split(" ").filter(Boolean);
    if (parts.length > 1) {
      return parts.every(function (part) { return index.stems.has(stem(part)); });
    }
    return false;
  }

  function termMatch(index, term) {
    var t = norm(term).trim();
    if (!t) return 0;
    if (t.indexOf(" ") !== -1) {
      if (index.padded.indexOf(" " + t + " ") !== -1) return 1;
      var parts = t.split(" ").filter(Boolean);
      if (parts.every(function (p) { return index.stems.has(stem(p)); })) return 0.8;
      var synPhrase = SYNONYMS[t] || [];
      for (var i = 0; i < synPhrase.length; i++) {
        if (phraseIn(index, synPhrase[i])) return 0.9;
      }
      var relPhrase = RELATED[t] || [];
      for (var j = 0; j < relPhrase.length; j++) {
        if (phraseIn(index, relPhrase[j])) return 0.5;
      }
      return 0;
    }
    if (index.tokens.has(t)) return 1;
    if (index.stems.has(stem(t))) return 0.95;
    var syn = SYNONYMS[t] || [];
    for (var k = 0; k < syn.length; k++) {
      var s = syn[k];
      if (s.indexOf(" ") !== -1) {
        if (phraseIn(index, s)) return 0.9;
      } else if (index.tokens.has(s) || index.stems.has(stem(s))) {
        return 0.9;
      }
    }
    var rel = RELATED[t] || [];
    for (var m = 0; m < rel.length; m++) {
      var r = rel[m];
      if (r.indexOf(" ") !== -1) {
        if (phraseIn(index, r)) return 0.5;
      } else if (index.tokens.has(r) || index.stems.has(stem(r))) {
        return 0.5;
      }
    }
    return 0;
  }

  function countOccurrences(index, term) {
    var t = norm(term).trim();
    if (!t) return 0;
    var re = new RegExp("(^|\\s)" + escapeRe(t) + "(?=\\s|$)", "g");
    var matches = index.flat.match(re);
    return matches ? matches.length : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Section + formatting detection                                      */
  /* ------------------------------------------------------------------ */

  var SECTION_PATTERNS = {
    summary: /(^|\n)\s*(professional\s+)?(summary|profile|objective|about\s+me)\s*[:\-]?\s*(\n|$)/i,
    experience: /(^|\n)\s*(work\s+|professional\s+|employment\s+|relevant\s+)?(experience|history)\s*[:\-]?\s*(\n|$)/i,
    education: /(^|\n)\s*education\s*[:\-]?\s*(\n|$)|\b(bachelor|master|mba|ph\.?d|b\.?s\.?|m\.?s\.?|associate('s)? degree|b\.?a\.?)\b/i,
    skills: /(^|\n)\s*(technical\s+|core\s+|key\s+)?(skills|technologies|competencies|tools|tech stack)\s*[:\-]?\s*(\n|$)/i,
    projects: /(^|\n)\s*(projects|portfolio|selected work)\s*[:\-]?\s*(\n|$)/i,
    certifications: /\b(certifications?|certified|licen[cs]e|licensure)\b/i
  };

  function detectSections(text) {
    var out = {};
    Object.keys(SECTION_PATTERNS).forEach(function (key) {
      out[key] = SECTION_PATTERNS[key].test(text);
    });
    return out;
  }

  function detectContact(text) {
    return {
      email: /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i.test(text),
      phone: /(\+?\d[\d\s().\-]{7,}\d)/.test(text),
      linkedin: /linkedin\.com\/[a-z0-9\-_/]+/i.test(text),
      portfolio: /(github\.com|gitlab\.com|behance\.net|dribbble\.com|[a-z0-9\-]+\.(dev|io|me|com)\/[a-z0-9\-_/]+)/i.test(text)
    };
  }

  function splitLines(text) {
    return String(text || "").split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function looksLikeHeading(line) {
    var wc = line.split(/\s+/).length;
    if (wc > 8) return false;
    if (/[.!?]$/.test(line) && wc > 4) return false;
    return wc <= 6 || /^[A-Z\s&/]+$/.test(line) || /:$/.test(line);
  }

  function getBullets(text) {
    var lines = splitLines(text);
    var bulleted = lines.filter(function (l) { return /^([-•*·▪◦–—]|\d+[.)])\s+/.test(l); });
    if (bulleted.length >= 4) return bulleted.map(function (l) { return l.replace(/^([-•*·▪◦–—]|\d+[.)])\s+/, ""); });
    var prose = lines.filter(function (l) {
      return l.split(/\s+/).length >= 7 && !looksLikeHeading(l) && !/@/.test(l);
    });
    return prose.length ? prose : bulleted;
  }

  function startsWithActionVerb(line) {
    var first = norm(line).split(/\s+/)[0] || "";
    first = cleanToken(first);
    if (!first) return false;
    if (ACTION_VERBS.has(first)) return true;
    var st = stem(first);
    var found = false;
    ACTION_VERBS.forEach(function (v) {
      if (!found && stem(v) === st) found = true;
    });
    return found;
  }

  function hasMetric(line) {
    var stripped = line.replace(/\b(19|20)\d{2}\b/g, " ");
    return /\d/.test(stripped) && /(\d+\s?%|\$\s?\d|\b\d[\d,.]*\s?(k|m|bn|b|million|billion|x|users|customers|clients|accounts|tickets|calls|people|employees|hours|days|weeks|months|projects|reports|stores|locations|percent)\b|(reduced|increased|improved|cut|saved|grew|raised|boosted|lowered|decreased)\b[^.]{0,40}\d)/i.test(stripped);
  }

  /* ------------------------------------------------------------------ */
  /* Keyword extraction                                                  */
  /* ------------------------------------------------------------------ */

  function extractJdKeywords(jobText, role) {
    var index = buildIndex(jobText);
    if (!index.flat) return [];

    var toks = words(jobText);
    var counts = Object.create(null);
    toks.forEach(function (t) {
      if (t.length < 2 || STOP.has(t) || GENERIC.has(t)) return;
      counts[t] = (counts[t] || 0) + 1;
    });

    var phraseCounts = Object.create(null);
    for (var i = 0; i < toks.length; i++) {
      for (var n = 2; n <= 3; n++) {
        var slice = toks.slice(i, i + n);
        if (slice.length < n) continue;
        if (STOP.has(slice[0]) || STOP.has(slice[n - 1]) || GENERIC.has(slice[0]) || GENERIC.has(slice[n - 1])) continue;
        var internalStop = slice.slice(1, -1).some(function (t) { return STOP.has(t); });
        if (internalStop) continue;
        var phrase = slice.join(" ");
        if (phrase.length < 6) continue;
        phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      }
    }

    var selected = new Map();
    var roleCore = role ? role.core : [];
    var roleTools = role ? role.tools : [];
    var known = roleCore.concat(roleTools, GLOBAL_SKILLS);

    known.forEach(function (term) {
      var t = norm(term).trim();
      if (!t) return;
      var hits = countOccurrences(index, t);
      if (hits > 0) {
        selected.set(t, { term: t, weight: 4 + hits * 1.5, known: true, hits: hits });
      }
    });

    Object.keys(phraseCounts).forEach(function (phrase) {
      if (startsWithActionVerb(phrase)) return; // "improve system" is not a skill
      if (phraseCounts[phrase] >= 3 && !selected.has(phrase)) {
        selected.set(phrase, { term: phrase, weight: phraseCounts[phrase] * 1.6, known: false, hits: phraseCounts[phrase] });
      }
    });

    Object.keys(counts).forEach(function (word) {
      if (counts[word] >= 3 && word.length > 3 && !selected.has(word) && !GENERIC.has(word)) {
        selected.set(word, { term: word, weight: counts[word], known: false, hits: counts[word] });
      }
    });

    var list = Array.from(selected.values()).sort(function (a, b) {
      return b.weight - a.weight || a.term.localeCompare(b.term);
    });

    // Drop a unigram when a stronger phrase already covers it.
    var kept = [];
    list.forEach(function (item) {
      var covered = kept.some(function (k) {
        return k.term.indexOf(item.term) !== -1 && k.term !== item.term && k.weight >= item.weight;
      });
      if (!covered) kept.push(item);
    });

    kept = kept.slice(0, 26);
    var max = kept.length ? kept[0].weight : 1;
    kept.forEach(function (item) {
      item.importance = Math.round(Math.max(0.15, item.weight / max) * 100) / 100;
      item.label = item.importance >= 0.7 ? "high" : item.importance >= 0.4 ? "medium" : "low";
      item.display = prettyTerm(item.term);
    });
    return kept;
  }

  /* ------------------------------------------------------------------ */
  /* Scoring                                                             */
  /* ------------------------------------------------------------------ */

  function clamp(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function gradeFor(score) {
    if (score >= 85) return "A";
    if (score >= 75) return "B";
    if (score >= 65) return "C";
    if (score >= 50) return "D";
    return "F";
  }

  function scoreKeyword(selected, resumeIndex, role, roleIndex) {
    var got = 0, total = 0;
    var matched = [], missing = [];

    selected.forEach(function (item) {
      var match = termMatch(resumeIndex, item.term);
      total += item.weight;
      got += item.weight * match;
      var entry = {
        term: item.term,
        display: item.display || prettyTerm(item.term),
        importance: item.importance,
        label: item.label,
        match: Math.round(match * 100) / 100,
        matched: match >= 0.5
      };
      if (entry.matched) matched.push(entry);
      else missing.push(entry);
    });

    var jdCoverage = total > 0 ? got / total : null;

    var roleTerms = [];
    if (role) {
      var seen = new Set();
      role.core.concat(role.tools).forEach(function (term) {
        var t = norm(term).trim();
        if (!t || seen.has(t)) return;
        seen.add(t);
        var m = roleIndex ? termMatch(roleIndex, t) : 0;
        roleTerms.push({ term: term, display: prettyTerm(term), matched: m >= 0.5, match: Math.round(m * 100) / 100 });
      });
    }
    var roleMatched = roleTerms.filter(function (t) { return t.matched; }).length;
    var roleCoverage = roleTerms.length ? roleMatched / roleTerms.length : null;

    var jdPart = jdCoverage == null ? 0 : jdCoverage;
    var rolePart = roleCoverage == null ? jdPart : roleCoverage;
    var blended = jdCoverage == null ? rolePart : (jdPart * 0.65 + rolePart * 0.35);
    var score = clamp(100 * Math.pow(Math.max(0, blended), 0.85));

    missing.sort(function (a, b) { return b.importance - a.importance; });
    matched.sort(function (a, b) { return b.importance - a.importance; });

    return {
      score: score,
      jdCoverage: jdCoverage == null ? null : Math.round(jdCoverage * 100),
      roleCoverage: roleCoverage == null ? null : Math.round(roleCoverage * 100),
      matched: matched,
      missing: missing,
      roleTerms: roleTerms
    };
  }

  function scoreStructure(text, index, sections, contact) {
    var score = 100;
    var notes = [];
    var wordCount = index.wordCount;
    var bullets = getBullets(text);
    var hasDates = (text.match(/\b(19|20)\d{2}\b/g) || []).length >= 2 ||
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(19|20)\d{2}\b/i.test(text);

    if (!contact.email) { score -= 14; notes.push("No email address found"); }
    if (!contact.phone) { score -= 8; notes.push("No phone number found"); }
    if (!contact.linkedin && !contact.portfolio) { score -= 4; notes.push("No LinkedIn or portfolio link"); }
    if (!sections.experience && !hasDates) { score -= 12; notes.push("No experience section or dates"); }
    else if (!sections.experience) { score -= 4; notes.push("No clear experience heading"); }
    if (!sections.skills) { score -= 10; notes.push("No skills section"); }
    if (!sections.education) { score -= 5; notes.push("No education details"); }
    if (!hasDates) { score -= 8; notes.push("No employment dates"); }
    if (wordCount < 220) { score -= 16; notes.push("Resume is very short (" + wordCount + " words)"); }
    else if (wordCount < 300) { score -= 6; notes.push("Concise resume (" + wordCount + " words)"); }
    if (wordCount > 1200) { score -= 5; notes.push("Resume is long (" + wordCount + " words)"); }
    if (bullets.length < 4 && wordCount > 300) { score -= 8; notes.push("Few bullet points"); }

    return { score: clamp(score), notes: notes, wordCount: wordCount, bullets: bullets, hasDates: hasDates };
  }

  function scoreImpact(bullets) {
    var score = 35;
    var total = bullets.length;
    var quantified = 0;
    var strong = 0;
    var weak = 0;
    var weakFound = {};
    var longBullets = 0;

    bullets.forEach(function (line) {
      if (hasMetric(line)) quantified++;
      if (startsWithActionVerb(line)) strong++;
      var lower = " " + norm(line) + " ";
      WEAK_PHRASES.forEach(function (p) {
        if (lower.indexOf(" " + p + " ") !== -1) {
          weak++;
          weakFound[p] = true;
        }
      });
      if (line.split(/\s+/).length > 34) longBullets++;
    });

    var qRatio = total ? quantified / total : 0;
    var sRatio = total ? strong / total : 0;
    score += 45 * Math.min(1, qRatio / 0.4);
    score += 20 * Math.min(1, sRatio / 0.7);
    score -= Math.min(25, weak * 5);
    score -= Math.min(12, longBullets * 3);

    return {
      score: clamp(score),
      bullets: total,
      quantified: quantified,
      strong: strong,
      weak: weak,
      weakFound: Object.keys(weakFound),
      longBullets: longBullets,
      quantifiedRatio: total ? Math.round((quantified / total) * 100) : 0,
      strongRatio: total ? Math.round((strong / total) * 100) : 0
    };
  }

  function scoreReadability(text, bullets) {
    var score = 100;
    var notes = [];
    var avg = 0;
    if (bullets.length) {
      avg = bullets.reduce(function (sum, l) { return sum + l.split(/\s+/).length; }, 0) / bullets.length;
      if (avg > 34) { score -= 18; notes.push("Bullets average " + Math.round(avg) + " words"); }
      else if (avg > 26) { score -= 9; notes.push("Bullets are long (avg " + Math.round(avg) + " words)"); }
      else if (avg < 9) { score -= 5; notes.push("Bullets are very short"); }
    } else {
      score -= 10;
      notes.push("No bullet points found");
    }

    var firstPerson = (text.match(/\b(I|me|my|mine)\b/g) || []).length;
    if (firstPerson > 3) { score -= 14; notes.push("First-person pronouns (" + firstPerson + ")"); }
    else if (firstPerson > 0) { score -= 7; notes.push("First-person pronouns (" + firstPerson + ")"); }

    var caps = (text.match(/\b[A-Z]{4,}\b/g) || []).filter(function (w) {
      return ["HTML", "CSS", "JSON", "REST", "APIS", "APIs", "SQL", "AWS", "GCP", "CI", "CD", "HTTP", "HTTPS", "UI", "UX", "QA", "HR", "IT", "USA", "MBA", "PMP", "CPA", "RN", "BSN", "ADN", "EHR", "EMR", "HIPAA", "GAAP", "KPI", "KPIs", "ROI", "CRM", "ERP", "SEO", "SEM", "SaaS", "B2B", "B2C", "IEEE", "OSHA", "ISO", "NEC", "UL", "PCB", "PLC", "CAD", "FEA", "CNC", "HVAC", "P&L", "A/B", "IEP", "CSAT", "SLA", "ETL", "API", "SDK", "IDE", "JVM", "SQL"].indexOf(w) === -1;
    }).length;
    if (caps > 8) { score -= 9; notes.push("Many all-caps words (" + caps + ")"); }

    var passive = (text.match(/\b(was|were|been|being)\s+\w+(ed|en)\b/gi) || []).length;
    if (passive > 2) { score -= 8; notes.push("Passive voice (" + passive + " instances)"); }

    var dense = splitLines(text).filter(function (l) { return l.length > 420; }).length;
    if (dense > 0) { score -= 6; notes.push("Long unbroken paragraphs"); }

    if (avg > 0 && avg >= 9 && avg <= 26 && caps <= 8) notes.push("Readable bullet length");

    return { score: clamp(score), notes: notes, avgBulletWords: Math.round(avg) };
  }

  /* ------------------------------------------------------------------ */
  /* Findings                                                            */
  /* ------------------------------------------------------------------ */

  function buildFindings(ctx) {
    var findings = [];
    var k = ctx.keywords;
    var s = ctx.structure;
    var i = ctx.impact;
    var r = ctx.readability;

    if (k.jdCoverage != null && k.jdCoverage < 55 && k.missing.length) {
      findings.push({
        severity: "critical",
        title: "Only " + k.jdCoverage + "% of the job's key terms appear",
        detail: "The posting emphasises " + k.missing.slice(0, 3).map(function (m) { return m.display || m.term; }).join(", ") + ". Missing terms carry real weight in keyword-based filters.",
        fix: "Work the top 3–5 missing terms into experience bullets where they are genuinely true, then re-run the scan."
      });
    } else if (k.jdCoverage != null && k.jdCoverage >= 75) {
      findings.push({
        severity: "good",
        title: "Strong keyword alignment (" + k.jdCoverage + "%)",
        detail: "Most of the posting's important terms already appear in your resume.",
        fix: "Keep the wording natural; matching every synonym is not the goal."
      });
    }

    if (k.roleCoverage != null && k.roleCoverage < 50) {
      var roleMissing = k.roleTerms.filter(function (t) { return !t.matched; }).slice(0, 6).map(function (t) { return t.display || t.term; });
      findings.push({
        severity: "warning",
        title: "Role checklist is " + k.roleCoverage + "% covered",
        detail: "Hiring managers for " + ctx.roleName + " roles expect to see: " + roleMissing.join(", ") + ".",
        fix: "Add the tools and skills you actually have. Leave out anything you cannot discuss in an interview."
      });
    }

    if (!ctx.contact.email || !ctx.contact.phone) {
      findings.push({
        severity: "critical",
        title: "Contact details are incomplete",
        detail: [ctx.contact.email ? null : "email", ctx.contact.phone ? null : "phone"].filter(Boolean).join(" and ") + " not detected. Parsers often drop resumes they cannot attribute.",
        fix: "Put your name, email, phone, city, and LinkedIn URL in plain text at the top — not inside a header, table, or image."
      });
    }

    if (i.quantifiedRatio < 30) {
      findings.push({
        severity: i.quantifiedRatio === 0 ? "critical" : "warning",
        title: "Only " + i.quantifiedRatio + "% of bullets show measurable impact",
        detail: i.quantified + " of " + i.bullets + " bullets contain a number, percentage, or dollar amount.",
        fix: "Rewrite three bullets as: action verb + what you did + measurable result. Example: \"Cut checkout latency 38% by caching product queries.\""
      });
    } else {
      findings.push({
        severity: "good",
        title: "Measurable results are present",
        detail: i.quantifiedRatio + "% of bullets include a metric — above the 30% target.",
        fix: "Keep leading with outcomes rather than responsibilities."
      });
    }

    if (i.weak > 0) {
      findings.push({
        severity: "warning",
        title: "Weak phrasing detected",
        detail: "Found: " + i.weakFound.join(", ") + ".",
        fix: "Replace with a specific action verb and an outcome. \"Responsible for reporting\" becomes \"Automated weekly reporting, saving 6 hours per month.\""
      });
    }

    if (!ctx.sections.skills) {
      findings.push({
        severity: "warning",
        title: "No skills section",
        detail: "A plain-text skills block is one of the easiest signals for both parsers and recruiters.",
        fix: "Add a \"Skills\" heading with comma-separated tools and competencies, mirroring the posting's wording."
      });
    }

    if (s.wordCount < 240) {
      findings.push({
        severity: "warning",
        title: "Resume may be too thin (" + s.wordCount + " words)",
        detail: "There is not much for a parser or recruiter to match against.",
        fix: "Aim for 400–700 words with 3–5 bullets per recent role, focused on outcomes."
      });
    } else if (s.wordCount > 1150) {
      findings.push({
        severity: "warning",
        title: "Resume is long (" + s.wordCount + " words)",
        detail: "Long resumes dilute keyword density and invite skimming.",
        fix: "Cut older or unrelated roles. Keep the last 10–15 years and the achievements that match this job."
      });
    }

    if (r.avgBulletWords > 30) {
      findings.push({
        severity: "warning",
        title: "Bullets are hard to scan",
        detail: "Bullets average " + r.avgBulletWords + " words. Recruiters skim; parsers segment sentences.",
        fix: "Trim each bullet to one idea under ~25 words. Move context to a separate line if needed."
      });
    }

    if (ctx.firstPerson > 0) {
      findings.push({
        severity: "warning",
        title: "First-person pronouns found",
        detail: "Resume convention drops \"I\", \"me\", and \"my\".",
        fix: "Start bullets with an implied subject: \"Led...\", \"Built...\", \"Reduced...\"."
      });
    }

    if (!s.hasDates) {
      findings.push({
        severity: "critical",
        title: "No employment dates detected",
        detail: "Date ranges are a core parsing field. Missing dates often break work-history reconstruction.",
        fix: "Add month + year ranges (e.g., \"Mar 2022 – Present\") in plain text next to each role."
      });
    }

    if (ctx.sections.experience && ctx.sections.skills && ctx.contact.email && ctx.contact.phone && ctx.impact.quantifiedRatio >= 30) {
      findings.push({
        severity: "good",
        title: "Core structure is parser-friendly",
        detail: "Contact block, experience, skills, and quantified bullets are all present.",
        fix: "Export as a single-column PDF or DOCX and re-check the plain-text copy before applying."
      });
    }

    var order = { critical: 0, warning: 1, good: 2 };
    findings.sort(function (a, b) { return order[a.severity] - order[b.severity]; });
    return findings;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  function analyze(input) {
    input = input || {};
    var resume = String(input.resume || "");
    var job = String(input.job || "");
    var role = input.role || null;
    var roleName = role ? role.title : "your target";

    var resumeIndex = buildIndex(resume);
    if (resumeIndex.wordCount < 25) {
      return { error: "Add at least a few lines of resume text (25+ words) to run the scan." };
    }

    var jobIndex = buildIndex(job);
    var jdKeywords = jobIndex.wordCount >= 6 ? extractJdKeywords(job, role) : [];
    var sections = detectSections(resume);
    var contact = detectContact(resume);
    var structure = scoreStructure(resume, resumeIndex, sections, contact);
    var impact = scoreImpact(structure.bullets);
    var readability = scoreReadability(resume, structure.bullets);
    var keywords = scoreKeyword(jdKeywords, resumeIndex, role, resumeIndex);

    var firstPerson = (resume.match(/\b(I|me|my|mine)\b/g) || []).length;

    var categoryScores = {
      keywords: keywords.score,
      structure: structure.score,
      impact: impact.score,
      readability: readability.score
    };

    var overall = clamp(
      categoryScores.keywords * 0.40 +
      categoryScores.structure * 0.20 +
      categoryScores.impact * 0.25 +
      categoryScores.readability * 0.15
    );

    var summary;
    if (overall >= 85) summary = "Excellent match. This resume is already in the top band — fix the remaining gaps to stay ahead of the field.";
    else if (overall >= 70) summary = "Solid foundation. A handful of targeted edits could push this into the top tier for this role.";
    else if (overall >= 55) summary = "This resume would likely be filtered for this role. The critical fixes below are high-leverage.";
    else summary = "Significant gaps. Work through the critical fixes before spending more applications on this version.";

    var ctx = {
      roleName: roleName,
      keywords: keywords,
      structure: structure,
      impact: impact,
      readability: readability,
      sections: sections,
      contact: contact,
      firstPerson: firstPerson
    };

    var findings = buildFindings(ctx);

    var passed = [];
    if (contact.email) passed.push("Email found");
    if (contact.phone) passed.push("Phone found");
    if (sections.experience) passed.push("Experience section");
    if (sections.skills) passed.push("Skills section");
    if (sections.education) passed.push("Education detected");
    if (impact.quantified > 0) passed.push(impact.quantified + " quantified bullets");
    if (keywords.jdCoverage != null && keywords.jdCoverage >= 70) passed.push(keywords.jdCoverage + "% job keyword match");

    return {
      score: overall,
      grade: gradeFor(overall),
      summary: summary,
      categories: [
        { key: "keywords", label: "Keyword match", score: categoryScores.keywords, weight: 40,
          note: keywords.jdCoverage == null ? "Based on role checklist" : keywords.jdCoverage + "% of job terms, " + keywords.roleCoverage + "% of role checklist" },
        { key: "structure", label: "Structure & parsing", score: categoryScores.structure, weight: 20,
          note: structure.notes.length ? structure.notes[0] : "Core sections present" },
        { key: "impact", label: "Impact & achievements", score: categoryScores.impact, weight: 25,
          note: impact.quantifiedRatio + "% of bullets quantified" },
        { key: "readability", label: "Readability", score: categoryScores.readability, weight: 15,
          note: readability.avgBulletWords ? "Avg bullet: " + readability.avgBulletWords + " words" : "No bullets detected" }
      ],
      keywords: keywords,
      structure: {
        wordCount: structure.wordCount,
        bulletCount: structure.bullets.length,
        hasDates: structure.hasDates,
        notes: structure.notes
      },
      impact: {
        bullets: impact.bullets,
        quantified: impact.quantified,
        quantifiedRatio: impact.quantifiedRatio,
        strongRatio: impact.strongRatio,
        weak: impact.weak,
        weakFound: impact.weakFound
      },
      readability: {
        score: readability.score,
        avgBulletWords: readability.avgBulletWords,
        notes: readability.notes
      },
      sections: sections,
      contact: contact,
      findings: findings,
      passed: passed,
      jobKeywordCount: jdKeywords.length,
      roleName: roleName
    };
  }

  return {
    analyze: analyze,
    extractJdKeywords: extractJdKeywords,
    termMatch: termMatch,
    buildIndex: buildIndex,
    norm: norm,
    stem: stem,
    version: "1.0.0"
  };
});
