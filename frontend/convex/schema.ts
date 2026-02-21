import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customers: defineTable({
    company: v.string(),
    segment: v.union(v.literal("Enterprise"), v.literal("SMB")),
    arr: v.number(),
    churned: v.boolean(),
    churn_reason: v.optional(v.string()),
  }),

  support_tickets: defineTable({
    customer_id: v.optional(v.string()),
    arr: v.number(),
    issue_text: v.string(),
  }),

  usage_metrics: defineTable({
    feature_name: v.string(),
    enterprise_adoption: v.number(),
    smb_adoption: v.number(),
  }),

  market_evidence: defineTable({
    company_name: v.string(),
    finding: v.string(),
    source: v.string(),
  }),

  external_signals: defineTable({
    source: v.string(),
    title: v.string(),
    excerpt: v.string(),
    url: v.optional(v.string()),
    theme: v.string(),
    scraped_at: v.number(),
  }),

  analyses: defineTable({
    status: v.union(
      v.literal("idle"),
      v.literal("extracting"),
      v.literal("researching"),
      v.literal("generating"),
      v.literal("complete")
    ),
    themes: v.optional(v.any()),
    revenue_exposure: v.optional(v.any()),
    recommendation: v.optional(v.string()),
    spec: v.optional(v.any()),
  }),
});
