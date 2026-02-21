import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    const tickets = await ctx.db.query("support_tickets").collect();

    const churnSignals = customers
      .filter((c) => c.churned && c.churn_reason)
      .map((c) => ({
        type: "churn" as const,
        id: c._id,
        company: c.company,
        segment: c.segment,
        arr: c.arr,
        text: c.churn_reason!,
      }));

    const ticketSignals = tickets.map((t) => ({
      type: "ticket" as const,
      id: t._id,
      company: null,
      segment: null,
      arr: t.arr,
      text: t.issue_text,
    }));

    return [...churnSignals, ...ticketSignals].sort((a, b) => b.arr - a.arr);
  },
});
