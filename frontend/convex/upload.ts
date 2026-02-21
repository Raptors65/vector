import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const ingestCSVData = mutation({
  args: {
    customers: v.array(
      v.object({
        company: v.string(),
        segment: v.union(v.literal("Enterprise"), v.literal("SMB")),
        arr: v.number(),
        churned: v.boolean(),
        churn_reason: v.optional(v.string()),
      })
    ),
    tickets: v.array(
      v.object({
        customer_id: v.optional(v.string()),
        arr: v.number(),
        issue_text: v.string(),
      })
    ),
    usageMetrics: v.array(
      v.object({
        feature_name: v.string(),
        enterprise_adoption: v.number(),
        smb_adoption: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Clear existing data
    const existingCustomers = await ctx.db.query("customers").collect();
    for (const c of existingCustomers) await ctx.db.delete(c._id);

    const existingTickets = await ctx.db.query("support_tickets").collect();
    for (const t of existingTickets) await ctx.db.delete(t._id);

    const existingMetrics = await ctx.db.query("usage_metrics").collect();
    for (const m of existingMetrics) await ctx.db.delete(m._id);

    // Clear any previous analyses
    const existingAnalyses = await ctx.db.query("analyses").collect();
    for (const a of existingAnalyses) await ctx.db.delete(a._id);

    // Insert new data
    for (const customer of args.customers) {
      await ctx.db.insert("customers", customer);
    }
    for (const ticket of args.tickets) {
      await ctx.db.insert("support_tickets", ticket);
    }
    for (const metric of args.usageMetrics) {
      await ctx.db.insert("usage_metrics", metric);
    }
  },
});
