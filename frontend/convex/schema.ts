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

  analyses: defineTable({
    themes: v.any(),
    revenue_exposure: v.any(),
    recommendation: v.string(),
    spec: v.any(),
  }),
});
