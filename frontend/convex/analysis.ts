import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const MINIMAX_BASE_URL = "https://api.minimax.io/anthropic/v1/messages";
const MODEL = "MiniMax-M2.5";
const RTRVR_URL = "https://api.rtrvr.ai/agent";

// Calls MiniMax via the Anthropic-compatible API.
// Uses tool_choice to force structured JSON output reliably.
async function callMiniMax(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  tool: { name: string; description: string; input_schema: object },
  maxTokens = 4096
): Promise<Record<string, unknown>> {
  const res = await fetch(MINIMAX_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`MiniMax API error ${res.status}: ${error}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find(
    (block: { type: string }) => block.type === "tool_use"
  );
  if (!toolUse) throw new Error("No tool_use block in MiniMax response");
  return toolUse.input as Record<string, unknown>;
}

// Calls rtrvr.ai to find 3 real-world market evidence cards for the top theme.
// Returns null on any failure — caller falls back to pre-seeded evidence.
type EvidenceCard = { company_name: string; finding: string; source: string };

async function callRtrvr(
  apiKey: string,
  topTheme: string
): Promise<EvidenceCard[] | null> {
  try {
    const res = await fetch(RTRVR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: `Search the web and find 3 real examples of well-known B2B SaaS companies (like Linear, Notion, Figma, Asana, Slack, GitHub, Atlassian) that faced the decision to build "${topTheme}" for enterprise customers. Look for published blog posts, case studies, G2 reviews, or product announcements. For each company, describe what they decided, what they built, and the business impact.`,
        schema: {
          type: "object",
          properties: {
            examples: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  finding: {
                    type: "string",
                    description:
                      "1-2 sentences: what they built or decided and the business impact",
                  },
                  source: {
                    type: "string",
                    description: "URL of the source article or page",
                  },
                },
                required: ["company_name", "finding", "source"],
              },
            },
          },
          required: ["examples"],
        },
        response: { verbosity: "final" },
      }),
    });

    if (!res.ok) {
      console.error(`rtrvr.ai error ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    // rtrvr wraps arrays in an object — handle { examples: [...] } and bare arrays
    const rawJson = data.result?.json;
    const rawCards: unknown[] = Array.isArray(rawJson)
      ? rawJson
      : Array.isArray(rawJson?.examples)
        ? rawJson.examples
        : [];

    if (rawCards.length === 0) {
      console.error("rtrvr.ai returned no evidence cards", data);
      return null;
    }

    // Validate shape and cap at 3
    const valid = rawCards
      .filter(
        (c): c is EvidenceCard =>
          c !== null &&
          typeof c === "object" &&
          typeof (c as EvidenceCard).company_name === "string" &&
          typeof (c as EvidenceCard).finding === "string" &&
          typeof (c as EvidenceCard).source === "string"
      )
      .slice(0, 3);

    return valid.length > 0 ? valid : null;
  } catch (err) {
    console.error("rtrvr.ai call failed:", err);
    return null;
  }
}

function computeRevenueExposure(
  customers: Array<{
    arr: number;
    churned: boolean;
    churn_reason?: string;
    segment: string;
  }>,
  topTheme: string
) {
  const totalARR = customers.reduce((sum, c) => sum + c.arr, 0);
  const churned = customers.filter((c) => c.churned);
  const currentChurnRate = churned.length / customers.length;

  const themeLower = topTheme.toLowerCase();
  const atRiskCustomers = churned.filter((c) => {
    const reason = c.churn_reason?.toLowerCase() ?? "";
    return (
      reason.includes(themeLower) ||
      (themeLower.includes("sso") &&
        (reason.includes("saml") ||
          reason.includes("single sign") ||
          reason.includes("sso") ||
          reason.includes("security")))
    );
  });

  const arrAtRisk = atRiskCustomers.reduce((sum, c) => sum + c.arr, 0);

  return {
    arr_at_risk: arrAtRisk,
    conservative: Math.round(arrAtRisk * 0.4),
    moderate: Math.round(arrAtRisk * 0.6),
    aggressive: Math.round(arrAtRisk * 0.8),
    total_arr: totalARR,
    current_churn_rate: currentChurnRate,
  };
}

// Standalone action: run rtrvr.ai research for a given theme and update
// market_evidence. Intended to be run once before a demo, not on every analysis.
export const refreshEvidence = action({
  args: { topTheme: v.string() },
  handler: async (ctx, { topTheme }) => {
    const apiKey = process.env.RTRVR_API_KEY;
    if (!apiKey) throw new Error("RTRVR_API_KEY not set");

    const cards = await callRtrvr(apiKey, topTheme);
    if (!cards || cards.length === 0) {
      throw new Error("rtrvr.ai returned no usable evidence cards");
    }

    await ctx.runMutation(api.marketEvidence.replace, { cards });
    return cards.length;
  },
});

export const runAnalysis = action({
  args: {},
  handler: async (ctx): Promise<Id<"analyses">> => {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) throw new Error("MINIMAX_API_KEY not set");

    // 1. Create analysis document
    const analysisId: Id<"analyses"> = await ctx.runMutation(api.analyses.create, {
      status: "extracting",
    });

    // 2. Fetch all data
    const customers = await ctx.runQuery(api.customers.list);
    const signals = await ctx.runQuery(api.signals.list);
    const usageMetrics = await ctx.runQuery(api.usageMetrics.list);

    // 3. Build context strings
    const churnContext = customers
      .filter((c: { churned: boolean; churn_reason?: string }) => c.churned && c.churn_reason)
      .map((c: { company: string; segment: string; arr: number; churn_reason?: string }) => `- ${c.company} (${c.segment}, $${c.arr}): "${c.churn_reason}"`)
      .join("\n");

    const ticketContext = signals
      .filter((s: { type: string }) => s.type === "ticket")
      .slice(0, 15)
      .map((t: { arr: number | null; text: string }) => `- $${t.arr}: "${t.text}"`)
      .join("\n");

    const usageContext = usageMetrics
      .map((m: { feature_name: string; enterprise_adoption: number; smb_adoption: number }) => `- ${m.feature_name}: Enterprise ${m.enterprise_adoption}%, SMB ${m.smb_adoption}%`)
      .join("\n");

    // 4. Theme extraction
    const themeResult = await callMiniMax(
      apiKey,
      "You are a product strategy analyst. Analyze customer churn data, support tickets, and usage metrics to identify what the company should build next to retain the most ARR.",
      `Churned customers:\n${churnContext}\n\nSupport tickets (by ARR):\n${ticketContext}\n\nFeature adoption:\n${usageContext}`,
      {
        name: "extract_themes",
        description: "Extract the top product theme driving churn and generate a recommendation",
        input_schema: {
          type: "object",
          properties: {
            top_theme: {
              type: "string",
              description: "The single most impactful feature to build, e.g. 'Enterprise SSO'",
            },
            stop_building: {
              type: "string",
              description: "Current initiative to deprioritize, e.g. 'Mobile Redesign'",
            },
            themes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  enterprise_mentions: { type: "number" },
                  smb_mentions: { type: "number" },
                  enterprise_arr_weighted: { type: "number" },
                  description: { type: "string" },
                },
                required: ["name", "enterprise_mentions", "smb_mentions", "enterprise_arr_weighted", "description"],
              },
            },
            reasoning: {
              type: "string",
              description: "2-3 sentences explaining the recommendation",
            },
          },
          required: ["top_theme", "stop_building", "themes", "reasoning"],
        },
      }
    );

    // 5. Update: themes extracted, move to researching
    await ctx.runMutation(api.analyses.update, {
      id: analysisId,
      status: "researching",
      themes: themeResult.themes,
    });

    // 6. Revenue exposure (deterministic math — no LLM needed)
    const revenueExposure = computeRevenueExposure(
      customers,
      themeResult.top_theme as string
    );

    const recommendation = `STOP: ${themeResult.stop_building}\nBUILD: ${themeResult.top_theme}\n+$${(revenueExposure.moderate / 1000).toFixed(0)}k–$${(revenueExposure.aggressive / 1000).toFixed(0)}k retained ARR`;

    // 7. Update: revenue computed, move to generating
    await ctx.runMutation(api.analyses.update, {
      id: analysisId,
      status: "generating",
      revenue_exposure: revenueExposure,
      recommendation,
    });

    // 8. Spec generation
    const spec = await callMiniMax(
      apiKey,
      "You are a senior software architect. Generate a concrete, machine-readable engineering spec. Be specific — this will be handed directly to engineers.",
      `Feature: ${themeResult.top_theme}\n\nContext:\n- ARR at risk: $${revenueExposure.arr_at_risk.toLocaleString()}\n- Why customers are churning: missing ${themeResult.top_theme}\n- Reasoning: ${themeResult.reasoning}\n\nGenerate a complete engineering spec.`,
      {
        name: "generate_spec",
        description: "Generate a machine-readable engineering spec for the feature",
        input_schema: {
          type: "object",
          properties: {
            feature_name: { type: "string" },
            summary: { type: "string", description: "One sentence description" },
            schema_changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  table: { type: "string" },
                  description: { type: "string" },
                  fields: { type: "array", items: { type: "string" } },
                },
                required: ["table", "description", "fields"],
              },
            },
            api_endpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  method: { type: "string" },
                  path: { type: "string" },
                  description: { type: "string" },
                },
                required: ["method", "path", "description"],
              },
            },
            ui_updates: {
              type: "array",
              items: { type: "string" },
            },
            task_graph: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  epic: { type: "string" },
                  stories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        subtasks: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "subtasks"],
                    },
                  },
                },
                required: ["epic", "stories"],
              },
            },
          },
          required: ["feature_name", "summary", "schema_changes", "api_endpoints", "ui_updates", "task_graph"],
        },
      },
      16000
    );

    // 9. Complete
    await ctx.runMutation(api.analyses.update, {
      id: analysisId,
      status: "complete",
      spec,
    });

    return analysisId;
  },
});
