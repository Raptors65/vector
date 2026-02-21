import { mutation } from "./_generated/server";

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of ["customers", "support_tickets", "usage_metrics", "analyses"] as const) {
      const rows = await ctx.db.query(table).collect();
      await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
    }
  },
});

export const seedMarketEvidence = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("market_evidence").collect();
    for (const doc of existing) await ctx.db.delete(doc._id);

    // Sourced by rtrvr.ai from real company pages
    const evidence = [
      {
        company_name: "Linear",
        finding:
          "Added SAML SSO and SCIM provisioning to centralize user management within identity providers, unblocking large enterprise migrations from legacy tools.",
        source: "https://linear.app/changelog/2022-10-19-2022-release",
      },
      {
        company_name: "Notion",
        finding:
          "Implemented SAML SSO to pivot from consumer app to enterprise collaboration tool, meeting strict security requirements and enabling automated user provisioning.",
        source: "https://www.notion.so/help/guides/everything-about-setting-up-and-managing-your-organization",
      },
      {
        company_name: "Figma",
        finding:
          "Introduced SAML SSO in its 'Organization' tier to help companies like Microsoft and Uber scale design management with enterprise-grade login restrictions.",
        source: "https://www.figma.com/blog/figma-3-0/",
      },
    ];

    for (const item of evidence) {
      await ctx.db.insert("market_evidence", item);
    }
  },
});
