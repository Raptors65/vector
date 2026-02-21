import { mutation } from "./_generated/server";

export const seedMarketEvidence = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("market_evidence").collect();
    if (existing.length > 0) return;

    const evidence = [
      {
        company_name: "Linear",
        finding:
          "Shipped SSO in year 2 → enterprise segment grew 3x, cited in 40% of G2 reviews as top adoption driver",
        source: "G2",
      },
      {
        company_name: "Asana",
        finding:
          "Delayed SSO by 18 months → lost 4 enterprise logos to Monday.com per G2 review data",
        source: "G2",
      },
      {
        company_name: "Notion",
        finding:
          "Added SSO late → now highest-voted open request among teams >50 seats",
        source: "Capterra",
      },
    ];

    for (const item of evidence) {
      await ctx.db.insert("market_evidence", item);
    }
  },
});
