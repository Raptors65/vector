import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("analyses").order("desc").first();
  },
});

export const create = mutation({
  args: {
    status: v.union(
      v.literal("idle"),
      v.literal("extracting"),
      v.literal("researching"),
      v.literal("generating"),
      v.literal("complete")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", { status: args.status });
  },
});

export const update = mutation({
  args: {
    id: v.id("analyses"),
    status: v.optional(
      v.union(
        v.literal("idle"),
        v.literal("extracting"),
        v.literal("researching"),
        v.literal("generating"),
        v.literal("complete")
      )
    ),
    themes: v.optional(v.any()),
    revenue_exposure: v.optional(v.any()),
    recommendation: v.optional(v.string()),
    spec: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, updates);
  },
});
