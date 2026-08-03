#!/usr/bin/env node

/**
 * Reusable pattern definitions and extraction helpers for the /learn command.
 * Extracted from evaluate-session.js (Stop-hook system, now replaced by /learn).
 */

const PATTERN_DEFS = {
  error_resolution: {
    title: "Error Resolution Pattern",
    tags: ["error-resolution", "stability"],
    keywords: [
      "error",
      "stack trace",
      "exception",
      "fix",
      "failing test",
      "regression",
      "diagnose",
      "repro",
      "root cause",
    ],
    steps: [
      "Capture the exact failure and affected scope.",
      "Identify the smallest reproducible scenario.",
      "Patch the root cause, then verify with targeted tests.",
      "Document guardrails to avoid recurrence.",
    ],
    caveats: [
      "Do not overfit to a single failing example if broader behavior differs.",
      "Avoid masking failures with broad catch-all handlers.",
    ],
  },
  user_corrections: {
    title: "User Correction Integration Pattern",
    tags: ["feedback-loop", "alignment"],
    keywords: [
      "correction",
      "actually",
      "instead",
      "prefer",
      "should be",
      "not this",
      "adjust",
      "revise",
      "change direction",
    ],
    steps: [
      "Extract the correction as a concrete rule.",
      "Apply the rule to current work and nearby decisions.",
      "Re-validate outputs against updated expectations.",
      "Capture the correction in reusable guidance.",
    ],
    caveats: [
      "Do not partially apply corrections; update all relevant touchpoints.",
      "If corrections conflict, prefer latest explicit user instruction.",
    ],
  },
  workarounds: {
    title: "Safe Workaround Pattern",
    tags: ["workaround", "delivery"],
    keywords: [
      "workaround",
      "temporary",
      "fallback",
      "mitigate",
      "unblock",
      "compatibility",
      "hotfix",
      "short-term",
    ],
    steps: [
      "Confirm the blocker and expected business impact.",
      "Implement the smallest safe workaround behind clear boundaries.",
      "Add validation or tests proving no regression in core paths.",
      "Record follow-up to remove workaround when root fix is ready.",
    ],
    caveats: [
      "Workarounds must be explicit and easy to remove.",
      "Avoid introducing hidden behavioral differences without documentation.",
    ],
  },
  debugging_techniques: {
    title: "Structured Debugging Pattern",
    tags: ["debugging", "analysis"],
    keywords: [
      "debug",
      "investigate",
      "inspect",
      "log",
      "trace",
      "breakpoint",
      "reproduce",
      "isolate",
      "hypothesis",
      "verify",
    ],
    steps: [
      "Form one hypothesis at a time from observable symptoms.",
      "Instrument selectively (logs, runtime values, targeted reads).",
      "Narrow scope until one causative change is identified.",
      "Validate fix with focused and then broader checks.",
    ],
    caveats: [
      "Avoid noisy instrumentation that obscures signal.",
      "Prefer deterministic repro over probabilistic assumptions.",
    ],
  },
  project_specific: {
    title: "Project-Specific Convention Pattern",
    tags: ["project-conventions", "consistency"],
    keywords: [
      "convention",
      "guideline",
      "architecture",
      "facade",
      "use case",
      "lint",
      "naming",
      "translation",
      "design system",
      "token",
    ],
    steps: [
      "Identify recurring project conventions applied during the session.",
      "Translate each convention into a simple decision checklist.",
      "Show one concrete example from this session.",
      "List anti-patterns that should be rejected in future work.",
    ],
    caveats: [
      "Conventions evolve; revalidate periodically against source docs.",
      "Do not generalize project-specific rules to unrelated repositories.",
    ],
  },
};

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "shall", "can", "need", "must", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "under", "again", "further",
  "then", "once", "here", "there", "when", "where", "why", "how", "all",
  "each", "every", "both", "few", "more", "most", "other", "some", "such",
  "no", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "because", "but", "and", "or", "if", "while", "this", "that", "these",
  "those", "it", "its", "i", "you", "he", "she", "we", "they", "me", "him",
  "her", "us", "them", "my", "your", "his", "our", "their", "what", "which",
  "who", "whom", "user", "assistant", "message", "tool", "text", "file",
  "line", "error", "fix", "use", "using", "used", "also", "like", "get",
  "set", "new", "old", "see", "try", "run", "make", "let", "put",
]);

function slugifyAscii(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function scorePattern(textLower, patternName) {
  const def = PATTERN_DEFS[patternName];
  if (!def) {
    return 0;
  }

  return def.keywords.reduce((score, keyword) => {
    return score + (textLower.includes(keyword.toLowerCase()) ? 1 : 0);
  }, 0);
}

function collectExamples(text, keywords) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const picks = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hit = keywords.some((keyword) =>
      lower.includes(keyword.toLowerCase()),
    );
    if (hit) {
      picks.push(line);
    }
    if (picks.length >= 2) {
      break;
    }
  }

  if (picks.length === 0) {
    return [
      "No direct excerpt available; inferred from recurring session flow.",
    ];
  }

  return picks.map((line) =>
    line.length > 160 ? `${line.slice(0, 157)}...` : line,
  );
}

/**
 * Extract a meaningful, descriptive slug from the session transcript
 * by finding the most distinctive keyword phrases that co-occur with
 * the pattern keywords. Produces names like "angular-facade-correction"
 * instead of generic "error-resolution-pattern".
 */
function deriveDescriptiveSlug(text, patternName, keywords) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Collect lines that match pattern keywords
  const matchingLines = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hit = keywords.some((kw) => lower.includes(kw.toLowerCase()));
    if (hit && line.length > 10 && line.length < 300) {
      matchingLines.push(lower);
    }
    if (matchingLines.length >= 20) break;
  }

  if (matchingLines.length === 0) {
    return slugifyAscii(patternName);
  }

  // Extract meaningful nouns/terms from matching lines
  // Filter out common stop words and pattern keywords themselves
  const patternKwSet = new Set(keywords.map((k) => k.toLowerCase()));

  const wordFreq = new Map();
  const joined = matchingLines.join(" ");
  const words = joined.match(/[a-z][a-z0-9]{2,}/g) || [];

  for (const word of words) {
    if (STOP_WORDS.has(word) || patternKwSet.has(word)) continue;
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Pick top 2-3 most frequent distinctive terms
  const sorted = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  if (sorted.length === 0) {
    return slugifyAscii(patternName);
  }

  // Combine with a short category hint
  const categoryHint = patternName.replace(/_/g, "-");
  const descriptive = sorted.join("-");
  return slugifyAscii(`${descriptive}-${categoryHint}`);
}

function buildSkillContent({
  skillName,
  signature,
  title,
  category,
  tags,
  examples,
  steps,
  caveats,
  sessionId,
  messageCount,
  autoApprove,
}) {
  const statusLine = autoApprove ? "approved" : "review-required";
  const safeSessionId = sessionId || "unknown-session";
  const description = `Use this pattern when handling recurring ${category.replaceAll("_", " ")} workflows.`;

  const yaml = [
    "---",
    `name: ${skillName}`,
    `description: ${description}`,
    `title: ${title}`,
    signature ? `signature: ${signature}` : null,
    "version: 1.0.0",
    "source: continuous-learning",
    `category: ${category}`,
    `status: ${statusLine}`,
    `session_id: ${safeSessionId}`,
    `message_count: ${messageCount}`,
    `tags: [${tags.join(", ")}]`,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const sectionExamples = examples.map((e) => `- ${e}`).join("\n");
  const sectionSteps = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const sectionCaveats = caveats.map((c) => `- ${c}`).join("\n");

  return [
    yaml,
    "",
    `# ${title}`,
    "",
    "## When to use",
    description,
    "",
    "## Steps",
    sectionSteps,
    "",
    "## Examples",
    sectionExamples,
    "",
    "## Caveats",
    sectionCaveats,
    "",
  ].join("\n");
}

module.exports = {
  PATTERN_DEFS,
  scorePattern,
  deriveDescriptiveSlug,
  collectExamples,
  buildSkillContent,
  slugifyAscii,
};
