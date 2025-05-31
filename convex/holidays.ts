import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId));

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));
    }
    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));
    }

    const holidays = await query.collect();
    return holidays;
  },
});

export const add = mutation({
  args: {
    date: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if holiday already exists for this date
    const existingHoliday = await ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .first();

    if (existingHoliday) {
      throw new Error("Holiday already exists for this date");
    }

    const holidayId = await ctx.db.insert("holidays", {
      userId,
      date: args.date,
      name: args.name,
      description: args.description || "",
    });

    return holidayId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("holidays"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const holiday = await ctx.db.get(args.id);
    if (!holiday || holiday.userId !== userId) {
      throw new Error("Holiday not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const isHoliday = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const holiday = await ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .first();

    return holiday;
  },
});

export const getMonthHolidays = query({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const monthStart = new Date(args.year, args.month, 1).getTime();
    const monthEnd = new Date(args.year, args.month + 1, 1).getTime();

    const holidays = await ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), monthStart))
      .filter((q) => q.lt(q.field("date"), monthEnd))
      .collect();

    return holidays;
  },
});
