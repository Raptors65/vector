import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("market_evidence").collect();
  },
});

// Atomically replaces all evidence rows. Called by the analysis pipeline
// after rtrvr.ai returns fresh results.
export const replace = mutation({
  args: {
    cards: v.array(
      v.object({
        company_name: v.string(),
        finding: v.string(),
        source: v.string(),
      })
    ),
  },
  handler: async (ctx, { cards }) => {
    const existing = await ctx.db.query("market_evidence").collect();
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));
    await Promise.all(cards.map((card) => ctx.db.insert("market_evidence", card)));
  },
});
