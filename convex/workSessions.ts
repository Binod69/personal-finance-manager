import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("workSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId));

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));
    }
    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));
    }

    const sessions = await query.order("desc").take(args.limit ?? 50);

    return sessions;
  },
});

export const add = mutation({
  args: {
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    breakMinutes: v.number(),
    hourlyRate: v.number(),
    description: v.optional(v.string()),
    isHoliday: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if the date is a holiday in the holiday calendar
    const holidayOnDate = await ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .first();

    // Use holiday status from calendar if not explicitly set
    const isHoliday =
      args.isHoliday !== undefined ? args.isHoliday : !!holidayOnDate;

    // Calculate total hours worked
    const start = new Date(`1970-01-01T${args.startTime}:00`);
    const end = new Date(`1970-01-01T${args.endTime}:00`);
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Handle overnight shifts
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    // Subtract break time
    const workedMinutes = totalMinutes - args.breakMinutes;
    const hoursWorked = workedMinutes / 60;

    // Calculate earnings with overtime and holiday rates
    const earnings = await calculateEarnings(
      ctx,
      userId,
      hoursWorked,
      args.hourlyRate,
      isHoliday,
      args.date
    );

    const sessionId = await ctx.db.insert("workSessions", {
      userId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      breakMinutes: args.breakMinutes,
      hoursWorked,
      hourlyRate: args.hourlyRate,
      totalEarnings: earnings.totalEarnings,
      regularEarnings: earnings.regularEarnings,
      overtimeEarnings: earnings.overtimeEarnings,
      holidayEarnings: earnings.holidayEarnings,
      regularHours: earnings.regularHours,
      overtimeHours: earnings.overtimeHours,
      description: args.description || "",
      isHoliday,
    });

    return sessionId;
  },
});

async function calculateEarnings(
  ctx: any,
  userId: string,
  hoursWorked: number,
  hourlyRate: number,
  isHoliday: boolean,
  currentDate: number
) {
  // Get current month's sessions to calculate overtime
  const monthStart = new Date(currentDate);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const monthSessions = await ctx.db
    .query("workSessions")
    .withIndex("by_user_and_date", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.gte(q.field("date"), monthStart.getTime()))
    .filter((q: any) => q.lt(q.field("date"), monthEnd.getTime()))
    .collect();

  // Calculate total overtime hours this month (excluding current session)
  const currentMonthOvertimeHours = monthSessions.reduce(
    (sum: number, session: any) => {
      return sum + (session.overtimeHours || 0);
    },
    0
  );

  let regularHours = 0;
  let overtimeHours = 0;
  let regularEarnings = 0;
  let overtimeEarnings = 0;
  let holidayEarnings = 0;

  if (isHoliday) {
    // Holiday work: all hours at 1.5x rate
    holidayEarnings = hoursWorked * hourlyRate * 1.5;
  } else {
    // Regular work day
    if (hoursWorked <= 8) {
      // All hours are regular
      regularHours = hoursWorked;
      regularEarnings = hoursWorked * hourlyRate;
    } else {
      // 8 hours regular, rest is overtime
      regularHours = 8;
      overtimeHours = hoursWorked - 8;
      regularEarnings = 8 * hourlyRate;

      // Calculate overtime rate based on monthly total
      const totalOvertimeThisMonth = currentMonthOvertimeHours + overtimeHours;

      if (totalOvertimeThisMonth <= 60) {
        // All overtime at 1.25x rate
        overtimeEarnings = overtimeHours * hourlyRate * 1.25;
      } else if (currentMonthOvertimeHours >= 60) {
        // All overtime at 1.5x rate (already over 60 hours)
        overtimeEarnings = overtimeHours * hourlyRate * 1.5;
      } else {
        // Split: some at 1.25x, some at 1.5x
        const hoursAt125 = 60 - currentMonthOvertimeHours;
        const hoursAt150 = overtimeHours - hoursAt125;
        overtimeEarnings =
          hoursAt125 * hourlyRate * 1.25 + hoursAt150 * hourlyRate * 1.5;
      }
    }
  }

  const totalEarnings = regularEarnings + overtimeEarnings + holidayEarnings;

  return {
    totalEarnings,
    regularEarnings,
    overtimeEarnings,
    holidayEarnings,
    regularHours,
    overtimeHours,
  };
}

export const remove = mutation({
  args: {
    id: v.id("workSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.id);
    if (!session || session.userId !== userId) {
      throw new Error("Work session not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const getWeeklyStats = query({
  args: {
    weekStart: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const weekEnd = args.weekStart + 7 * 24 * 60 * 60 * 1000;

    const sessions = await ctx.db
      .query("workSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), args.weekStart))
      .filter((q) => q.lt(q.field("date"), weekEnd))
      .collect();

    // Get holidays for this week
    const holidays = await ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), args.weekStart))
      .filter((q) => q.lt(q.field("date"), weekEnd))
      .collect();

    const totalHours = sessions.reduce(
      (sum, session) => sum + session.hoursWorked,
      0
    );
    const totalEarnings = sessions.reduce(
      (sum, session) => sum + session.totalEarnings,
      0
    );
    const regularHours = sessions.reduce(
      (sum, session) => sum + (session.regularHours || 0),
      0
    );
    const overtimeHours = sessions.reduce(
      (sum, session) => sum + (session.overtimeHours || 0),
      0
    );
    const workDays = sessions.length;
    const holidayDays = sessions.filter((s) => s.isHoliday).length;
    const totalHolidaysInWeek = holidays.length;

    return {
      totalHours,
      totalEarnings,
      regularHours,
      overtimeHours,
      workDays,
      holidayDays,
      totalHolidaysInWeek,
      averageHoursPerDay: workDays > 0 ? totalHours / workDays : 0,
      sessions,
      holidays,
    };
  },
});

export const getMonthlyStats = query({
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

    const sessions = await ctx.db
      .query("workSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), monthStart))
      .filter((q) => q.lt(q.field("date"), monthEnd))
      .collect();

    // Get holidays for this month
    const holidays = await ctx.db
      .query("holidays")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), monthStart))
      .filter((q) => q.lt(q.field("date"), monthEnd))
      .collect();

    const totalHours = sessions.reduce(
      (sum, session) => sum + session.hoursWorked,
      0
    );
    const totalEarnings = sessions.reduce(
      (sum, session) => sum + session.totalEarnings,
      0
    );
    const regularHours = sessions.reduce(
      (sum, session) => sum + (session.regularHours || 0),
      0
    );
    const overtimeHours = sessions.reduce(
      (sum, session) => sum + (session.overtimeHours || 0),
      0
    );
    const workDays = sessions.length;
    const holidayDays = sessions.filter((s) => s.isHoliday).length;
    const totalHolidaysInMonth = holidays.length;

    // Group by week
    const weeklyData = new Map();
    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          hours: 0,
          earnings: 0,
          days: 0,
          holidays: 0,
          regularHours: 0,
          overtimeHours: 0,
        });
      }

      const week = weeklyData.get(weekKey);
      week.hours += session.hoursWorked;
      week.earnings += session.totalEarnings;
      week.regularHours += session.regularHours || 0;
      week.overtimeHours += session.overtimeHours || 0;
      week.days += 1;
      if (session.isHoliday) week.holidays += 1;
    });

    return {
      totalHours,
      totalEarnings,
      regularHours,
      overtimeHours,
      workDays,
      holidayDays,
      totalHolidaysInMonth,
      averageHoursPerDay: workDays > 0 ? totalHours / workDays : 0,
      weeklyBreakdown: Array.from(weeklyData.entries()).map(([week, data]) => ({
        week,
        ...data,
      })),
      sessions,
      holidays,
    };
  },
});

export const getYearlyData = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const yearStart = new Date(args.year, 0, 1).getTime();
    const yearEnd = new Date(args.year + 1, 0, 1).getTime();

    const sessions = await ctx.db
      .query("workSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), yearStart))
      .filter((q) => q.lt(q.field("date"), yearEnd))
      .collect();

    // Initialize monthly data array (12 months)
    const monthlyData = Array.from({ length: 12 }, () => ({
      totalHours: 0,
      totalEarnings: 0,
      regularHours: 0,
      overtimeHours: 0,
      workDays: 0,
      holidayDays: 0,
      averageHoursPerDay: 0,
    }));

    // Group sessions by month
    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      const monthIndex = sessionDate.getMonth();

      monthlyData[monthIndex].totalHours += session.hoursWorked;
      monthlyData[monthIndex].totalEarnings += session.totalEarnings;
      monthlyData[monthIndex].regularHours += session.regularHours || 0;
      monthlyData[monthIndex].overtimeHours += session.overtimeHours || 0;
      monthlyData[monthIndex].workDays += 1;
      if (session.isHoliday) {
        monthlyData[monthIndex].holidayDays += 1;
      }
    });

    // Calculate averages for each month
    monthlyData.forEach((month) => {
      if (month.workDays > 0) {
        month.averageHoursPerDay = month.totalHours / month.workDays;
      }
    });

    // Calculate yearly totals
    const totalHours = sessions.reduce(
      (sum, session) => sum + session.hoursWorked,
      0
    );
    const totalEarnings = sessions.reduce(
      (sum, session) => sum + session.totalEarnings,
      0
    );
    const totalRegularHours = sessions.reduce(
      (sum, session) => sum + (session.regularHours || 0),
      0
    );
    const totalOvertimeHours = sessions.reduce(
      (sum, session) => sum + (session.overtimeHours || 0),
      0
    );
    const totalWorkDays = sessions.length;
    const totalHolidayDays = sessions.filter((s) => s.isHoliday).length;

    return {
      monthlyData,
      totalHours,
      totalEarnings,
      totalRegularHours,
      totalOvertimeHours,
      totalWorkDays,
      totalHolidayDays,
      averageHoursPerWorkDay:
        totalWorkDays > 0 ? totalHours / totalWorkDays : 0,
      averageEarningsPerWorkDay:
        totalWorkDays > 0 ? totalEarnings / totalWorkDays : 0,
      averageMonthlyEarnings: totalEarnings / 12,
    };
  },
});
