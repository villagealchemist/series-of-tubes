import type { ActivitySummaryOutput } from "../../aapi/activity-summary.js";

const discordContentLimit = 2000;
const safeContentLimit = 1900;

export function renderActivitySummary(summary: ActivitySummaryOutput): string {
  const sections = [
    `## ${summary.headline}`,
    summary.overview,
    renderList("Needs your attention", summary.needsAttention),
    renderList("Decisions", summary.decisions),
    renderList("Follow-ups", summary.followUps),
    renderList("Safe to ignore", summary.safeToIgnore),
  ].filter((section) => section.length > 0);

  return fitContent(sections.join("\n\n"));
}

function renderList(title: string, items: readonly string[]): string {
  if (items.length === 0) return "";
  return [`**${title}**`, ...items.map((item) => `- ${item}`)].join("\n");
}

function fitContent(content: string): string {
  if (content.length <= discordContentLimit) return content;
  return `${content.slice(0, safeContentLimit).trimEnd()}\n\n[Summary trimmed to fit Discord.]`;
}
