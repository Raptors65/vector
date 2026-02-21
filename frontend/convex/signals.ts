import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    const tickets = await ctx.db.query("support_tickets").collect();
    const external = await ctx.db.query("external_signals").order("desc").take(10);

    const churnSignals = customers
      .filter((c) => c.churned && c.churn_reason)
      .map((c) => ({
        type: "churn" as const,
        id: c._id,
        company: c.company,
        segment: c.segment,
        arr: c.arr as number | null,
        text: c.churn_reason!,
        source: null as string | null,
        url: null as string | null,
      }));

    const ticketSignals = tickets.map((t) => ({
      type: "ticket" as const,
      id: t._id,
      company: null as string | null,
      segment: null as string | null,
      arr: t.arr as number | null,
      text: t.issue_text,
      source: null as string | null,
      url: null as string | null,
    }));

    const webSignals = external.map((e) => ({
      type: "web" as const,
      id: e._id,
      company: null as string | null,
      segment: null as string | null,
      arr: null as number | null,
      text: e.excerpt,
      source: e.source,
      url: e.url ?? null,
    }));

    return [...churnSignals, ...ticketSignals, ...webSignals].sort(
      (a, b) => (b.arr ?? 0) - (a.arr ?? 0)
    );
  },
});
