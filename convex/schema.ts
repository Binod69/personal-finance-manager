import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    date: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_category", ["userId", "category"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"]),

  workSessions: defineTable({
    userId: v.id("users"),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    breakMinutes: v.number(),
    hoursWorked: v.number(),
    hourlyRate: v.number(),
    totalEarnings: v.number(),
    regularEarnings: v.optional(v.number()),
    overtimeEarnings: v.optional(v.number()),
    holidayEarnings: v.optional(v.number()),
    regularHours: v.optional(v.number()),
    overtimeHours: v.optional(v.number()),
    description: v.string(),
    isHoliday: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  holidays: defineTable({
    userId: v.id("users"),
    date: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
