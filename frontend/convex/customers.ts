import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect();
  },
});

export const segmentSummary = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();

    const enterprise = customers.filter((c) => c.segment === "Enterprise");
    const smb = customers.filter((c) => c.segment === "SMB");

    const enterpriseARR = enterprise.reduce((sum, c) => sum + c.arr, 0);
    const smbARR = smb.reduce((sum, c) => sum + c.arr, 0);

    const enterpriseChurnRate =
      enterprise.length > 0
        ? enterprise.filter((c) => c.churned).length / enterprise.length
        : 0;

    const smbChurnRate =
      smb.length > 0
        ? smb.filter((c) => c.churned).length / smb.length
        : 0;

    return {
      enterpriseARR,
      smbARR,
      totalARR: enterpriseARR + smbARR,
      enterpriseChurnRate,
      smbChurnRate,
    };
  },
});
