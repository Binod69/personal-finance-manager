import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.type) {
      return await ctx.db
        .query("categories")
        .withIndex("by_user_and_type", (q) => 
          q.eq("userId", userId).eq("type", args.type!)
        )
        .collect();
    }

    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const categoryId = await ctx.db.insert("categories", {
      userId,
      name: args.name,
      type: args.type,
      color: args.color,
    });

    return categoryId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const initializeDefaultCategories = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user already has categories
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingCategories) {
      return; // User already has categories
    }

    const defaultCategories = [
      // Expense categories
      { name: "Food & Dining", type: "expense" as const, color: "#ef4444" },
      { name: "Transportation", type: "expense" as const, color: "#f97316" },
      { name: "Shopping", type: "expense" as const, color: "#eab308" },
      { name: "Entertainment", type: "expense" as const, color: "#22c55e" },
      { name: "Bills & Utilities", type: "expense" as const, color: "#3b82f6" },
      { name: "Healthcare", type: "expense" as const, color: "#8b5cf6" },
      { name: "Other", type: "expense" as const, color: "#6b7280" },
      
      // Income categories
      { name: "Salary", type: "income" as const, color: "#10b981" },
      { name: "Freelance", type: "income" as const, color: "#06b6d4" },
      { name: "Investment", type: "income" as const, color: "#8b5cf6" },
      { name: "Other Income", type: "income" as const, color: "#6b7280" },
    ];

    for (const category of defaultCategories) {
      await ctx.db.insert("categories", {
        userId,
        ...category,
      });
    }
  },
});
