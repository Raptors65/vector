import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("external_signals").order("desc").take(10);
  },
});

export const clearExternalSignals = mutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("external_signals").collect();
    await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
  },
});

export const seedExternalSignals = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("external_signals").collect();
    for (const doc of existing) await ctx.db.delete(doc._id);

    const now = Date.now();
    const signals = [
      {
        source: "reddit",
        title: "SSO requirement is killing every enterprise deal we have",
        excerpt:
          "We keep losing deals at the IT security review stage. Every enterprise prospect requires SAML SSO as a hard requirement and we just don't have it. Third deal this quarter.",
        url: "https://reddit.com/r/SaaS",
        theme: "Enterprise SSO",
        scraped_at: now,
      },
      {
        source: "hackernews",
        title: "Ask HN: How did you handle SSO for your B2B SaaS?",
        excerpt:
          "We're a 40-person team collaboration tool. Just lost our second enterprise deal this month to a competitor that has SSO. Was it worth building in-house or did you use a vendor?",
        url: "https://news.ycombinator.com",
        theme: "Enterprise SSO",
        scraped_at: now,
      },
      {
        source: "g2",
        title: "Great tool, but IT won't approve it without SAML",
        excerpt:
          "Love everything about this product but our IT and security team won't sign off on onboarding 200 engineers without SAML SSO. Hoping this ships soon or we'll have to switch.",
        theme: "Enterprise SSO",
        scraped_at: now,
      },
      {
        source: "reddit",
        title: "Linear vs competitors for 300-person eng org?",
        excerpt:
          "SSO is non-negotiable for our IT team. Whichever tool supports SAML first wins our business. Currently evaluating three options and this is the deciding factor.",
        url: "https://reddit.com/r/projectmanagement",
        theme: "Enterprise SSO",
        scraped_at: now,
      },
      {
        source: "hackernews",
        title: "The hidden cost of missing enterprise features",
        excerpt:
          "SSO sounds like a small feature but it's a hard blocker for any company with a real IT department. We've seen ARR pipeline stall out for months waiting for it to ship.",
        url: "https://news.ycombinator.com",
        theme: "Enterprise SSO",
        scraped_at: now,
      },
    ];

    for (const signal of signals) {
      await ctx.db.insert("external_signals", signal);
    }
  },
});
