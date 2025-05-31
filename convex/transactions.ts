import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 50);

    return transactions;
  },
});

export const add = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const transactionId = await ctx.db.insert("transactions", {
      userId,
      amount: args.amount,
      description: args.description,
      category: args.category,
      type: args.type,
      date: args.date ?? Date.now(),
    });

    return transactionId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const transaction = await ctx.db.get(args.id);
    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const getBalance = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  },
});

export const getCategorySpending = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const daysAgo = args.days ?? 30;
    const cutoffDate = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).gte("date", cutoffDate)
      )
      .collect();

    const categoryTotals = new Map<string, number>();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const current = categoryTotals.get(transaction.category) ?? 0;
        categoryTotals.set(transaction.category, current + transaction.amount);
      });

    return Array.from(categoryTotals.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  },
});
