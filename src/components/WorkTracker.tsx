import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function WorkTracker() {
  const [activeTab, setActiveTab] = useState<
    "add" | "history" | "stats" | "monthly"
  >("add");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("06:45");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [hourlyRate, setHourlyRate] = useState(1050);
  const [description, setDescription] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const addWorkSession = useMutation(api.workSessions.add);
  const removeWorkSession = useMutation(api.workSessions.remove);
  const workSessions = useQuery(api.workSessions.list, { limit: 100 }); // Get more items for pagination

  // Check if selected date is a holiday
  const selectedDateHoliday = useQuery(api.holidays.isHoliday, {
    date: new Date(date).getTime(),
  });

  // Get current week stats
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyStats = useQuery(api.workSessions.getWeeklyStats, {
    weekStart: weekStart.getTime(),
  });

  // Get current month stats
  const monthlyStats = useQuery(api.workSessions.getMonthlyStats, {
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  // Get yearly data for monthly view
  const yearlyData = useQuery(api.workSessions.getYearlyData, {
    year: selectedYear,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const calculatePreview = () => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const workedMinutes = totalMinutes - breakMinutes;
    const hoursWorked = workedMinutes / 60;

    let regularHours = 0;
    let overtimeHours = 0;
    let earnings = 0;

    // Check if it's a holiday (either manually set or from calendar)
    const isHolidayWork = isHoliday || !!selectedDateHoliday;

    if (isHolidayWork) {
      // Holiday work: all hours at 1.5x rate
      earnings = hoursWorked * hourlyRate * 1.5;
    } else {
      if (hoursWorked <= 8) {
        regularHours = hoursWorked;
        earnings = hoursWorked * hourlyRate;
      } else {
        regularHours = 8;
        overtimeHours = hoursWorked - 8;
        earnings = 8 * hourlyRate + overtimeHours * hourlyRate * 1.25; // Assuming first 60 hours of overtime
      }
    }

    return {
      hoursWorked,
      regularHours,
      overtimeHours,
      earnings,
      isHoliday: isHolidayWork,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !startTime || !endTime || hourlyRate <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addWorkSession({
        date: new Date(date).getTime(),
        startTime,
        endTime,
        breakMinutes,
        hourlyRate,
        description,
        isHoliday,
      });

      toast.success("Work session added successfully!");

      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setEndTime("17:00");
      setBreakMinutes(60);
      setDescription("");
      setIsHoliday(false);
    } catch (error) {
      toast.error("Failed to add work session");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm("Are you sure you want to delete this work session?")) {
      try {
        await removeWorkSession({ id: sessionId as any });
        toast.success("Work session deleted successfully");
      } catch (error) {
        toast.error("Failed to delete work session");
      }
    }
  };

  const preview = calculatePreview();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Tracker</h1>
          <p className="text-gray-600 mt-1">
            Track your working hours and earnings with overtime calculations
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("add")}
          className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === "add"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Add Session
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setCurrentPage(1);
          }}
          className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === "history"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === "stats"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === "monthly"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Monthly Data
        </button>
      </div>

      {/* Add Session Tab */}
      {activeTab === "add" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Work Session
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedDateHoliday && (
                  <p className="text-sm text-orange-600 mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Holiday: {selectedDateHoliday.name}
                  </p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Break and Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="breakMinutes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Break (minutes)
                  </label>
                  <input
                    type="number"
                    id="breakMinutes"
                    value={breakMinutes}
                    onChange={(e) =>
                      setBreakMinutes(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hourlyRate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Hourly Rate (¥)
                  </label>
                  <input
                    type="number"
                    id="hourlyRate"
                    value={hourlyRate}
                    onChange={(e) =>
                      setHourlyRate(parseFloat(e.target.value) || 0)
                    }
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description (optional)
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Holiday Override */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHoliday"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isHoliday"
                  className="text-sm font-medium text-gray-700"
                >
                  Override holiday status (1.5x rate for all hours)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add Work Session
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Session Preview
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Hours:</span>
                <span className="font-semibold">
                  {formatHours(preview.hoursWorked)}
                </span>
              </div>

              {!preview.isHoliday && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Regular Hours:</span>
                    <span className="font-semibold">
                      {formatHours(preview.regularHours)}
                    </span>
                  </div>
                  {preview.overtimeHours > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Overtime Hours:</span>
                      <span className="font-semibold text-orange-600">
                        {formatHours(preview.overtimeHours)}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-semibold">
                  {formatCurrency(hourlyRate)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Break Time:</span>
                <span className="font-semibold">{breakMinutes} minutes</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-md">
                <span className="text-green-800 font-medium">
                  Total Earnings:
                </span>
                <span className="text-green-800 font-bold text-lg">
                  {formatCurrency(preview.earnings)}
                </span>
              </div>
              {preview.isHoliday && (
                <div className="text-center text-sm text-orange-600 bg-orange-50 py-2 px-3 rounded-md">
                  🎉 Holiday rate: All hours at 1.5x (
                  {formatCurrency(hourlyRate * 1.5)}/hr)
                </div>
              )}
              {!preview.isHoliday && preview.overtimeHours > 0 && (
                <div className="text-center text-sm text-orange-600 bg-orange-50 py-2 px-3 rounded-md">
                  ⏰ Overtime: {formatHours(preview.overtimeHours)} at 1.25x
                  rate
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Work History
                </h2>
                <p className="text-gray-600 mt-1">
                  Your work sessions with overtime calculations
                </p>
              </div>
              {workSessions && workSessions.length > 0 && (
                <div className="text-sm text-gray-500">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    workSessions.length
                  )}{" "}
                  - {Math.min(currentPage * itemsPerPage, workSessions.length)}{" "}
                  of {workSessions.length} sessions
                </div>
              )}
            </div>
          </div>

          {workSessions === undefined ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : workSessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                No work sessions yet. Add your first session to get started!
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {workSessions
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((session) => (
                    <div
                      key={session._id}
                      className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${session.isHoliday ? "bg-orange-500" : "bg-blue-500"}`}
                            ></div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {new Date(session.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {session.startTime} - {session.endTime}
                                </p>
                              </div>
                              {session.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {session.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                <span>
                                  Total: {formatHours(session.hoursWorked)}
                                </span>
                                {session.regularHours &&
                                  session.regularHours > 0 && (
                                    <span>
                                      Regular:{" "}
                                      {formatHours(session.regularHours)}
                                    </span>
                                  )}
                                {session.overtimeHours &&
                                  session.overtimeHours > 0 && (
                                    <span className="text-orange-600">
                                      Overtime:{" "}
                                      {formatHours(session.overtimeHours)}
                                    </span>
                                  )}
                                <span>
                                  Rate: {formatCurrency(session.hourlyRate)}/hr
                                </span>
                                {session.breakMinutes > 0 && (
                                  <span>Break: {session.breakMinutes}m</span>
                                )}
                                {session.isHoliday && (
                                  <span className="text-orange-600">
                                    Holiday (1.5x)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(session.totalEarnings)}
                            </p>
                            {session.regularEarnings &&
                              session.overtimeEarnings && (
                                <div className="text-xs text-gray-500">
                                  <div>
                                    Regular:{" "}
                                    {formatCurrency(session.regularEarnings)}
                                  </div>
                                  <div>
                                    Overtime:{" "}
                                    {formatCurrency(session.overtimeEarnings)}
                                  </div>
                                </div>
                              )}
                            {session.holidayEarnings && (
                              <div className="text-xs text-orange-600">
                                Holiday:{" "}
                                {formatCurrency(session.holidayEarnings)}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(session._id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete session"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              {workSessions.length > itemsPerPage && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of{" "}
                      {Math.ceil(workSessions.length / itemsPerPage)}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <span className="px-3 py-2 text-sm text-gray-700">
                        {currentPage} /{" "}
                        {Math.ceil(workSessions.length / itemsPerPage)}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              Math.ceil(workSessions.length / itemsPerPage),
                              currentPage + 1
                            )
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(workSessions.length / itemsPerPage)
                        }
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Weekly Stats */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              This Week
            </h2>
            {weeklyStats === undefined ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatHours(weeklyStats.totalHours)}
                  </p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatHours(weeklyStats.regularHours || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Regular Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatHours(weeklyStats.overtimeHours || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Overtime Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(weeklyStats.totalEarnings)}
                  </p>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {weeklyStats.workDays}
                  </p>
                  <p className="text-sm text-gray-600">Work Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {weeklyStats.totalHolidaysInWeek || 0}
                  </p>
                  <p className="text-sm text-gray-600">Holiday Days</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ({weeklyStats.holidayDays} worked)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Stats */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              This Month
            </h2>
            {monthlyStats === undefined ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatHours(monthlyStats.totalHours)}
                    </p>
                    <p className="text-sm text-gray-600">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatHours(monthlyStats.regularHours || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Regular Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatHours(monthlyStats.overtimeHours || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Overtime Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(monthlyStats.totalEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {monthlyStats.workDays}
                    </p>
                    <p className="text-sm text-gray-600">Work Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {monthlyStats.totalHolidaysInMonth || 0}
                    </p>
                    <p className="text-sm text-gray-600">Holiday Days</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ({monthlyStats.holidayDays} worked)
                    </p>
                  </div>
                </div>

                {/* Holiday List */}
                {monthlyStats.holidays && monthlyStats.holidays.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold text-orange-900 mb-2">
                      Holidays This Month
                    </h3>
                    <div className="space-y-1">
                      {monthlyStats.holidays.map((holiday) => (
                        <div
                          key={holiday._id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-orange-800">
                            {holiday.name}
                          </span>
                          <span className="text-orange-600">
                            {new Date(holiday.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overtime Rate Info */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Overtime Rate Information
                  </h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Regular work: Standard hourly rate</p>
                    <p>
                      • Daily overtime ({">"}8 hours): +25% for first 60
                      hours/month
                    </p>
                    <p>
                      • Monthly overtime ({">"}60 hours): +50% for hours beyond
                      60
                    </p>
                    <p>• Holiday work: +50% for all hours</p>
                    <p className="font-medium mt-2">
                      Current month overtime:{" "}
                      {formatHours(monthlyStats.overtimeHours || 0)}
                      {(monthlyStats.overtimeHours || 0) > 60 && (
                        <span className="text-orange-600">
                          {" "}
                          (Over 60 hours - 50% rate applies)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Weekly Breakdown */}
                {monthlyStats.weeklyBreakdown.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">
                      Weekly Breakdown
                    </h3>
                    <div className="space-y-2">
                      {monthlyStats.weeklyBreakdown.map((week, index) => (
                        <div
                          key={week.week}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-md gap-2"
                        >
                          <span className="font-medium text-gray-700">
                            Week {index + 1} (
                            {new Date(week.week).toLocaleDateString()})
                          </span>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-blue-600">
                              {formatHours(week.hours)}
                            </span>
                            <span className="text-green-600">
                              Reg: {formatHours(week.regularHours || 0)}
                            </span>
                            <span className="text-orange-600">
                              OT: {formatHours(week.overtimeHours || 0)}
                            </span>
                            <span className="text-green-600">
                              {formatCurrency(week.earnings)}
                            </span>
                            <span className="text-purple-600">
                              {week.days} days
                            </span>
                            {week.holidays > 0 && (
                              <span className="text-orange-600">
                                {week.holidays} holidays
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Data Tab */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Year Selector */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Monthly Work Data
              </h2>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="year"
                  className="text-sm font-medium text-gray-700"
                >
                  Year:
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {yearlyData === undefined ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yearlyData.monthlyData.map((monthData, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {monthNames[index]}
                    </h3>
                    {monthData.workDays > 0 && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {monthData.workDays} days
                      </span>
                    )}
                  </div>

                  {monthData.workDays === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No work sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Hours:
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatHours(monthData.totalHours)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Regular:</span>
                        <span className="font-semibold text-green-600">
                          {formatHours(monthData.regularHours || 0)}
                        </span>
                      </div>

                      {(monthData.overtimeHours || 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Overtime:
                          </span>
                          <span className="font-semibold text-orange-600">
                            {formatHours(monthData.overtimeHours || 0)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Total Earnings:
                        </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(monthData.totalEarnings)}
                        </span>
                      </div>

                      {(monthData.holidayDays || 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Holiday Days:
                          </span>
                          <span className="font-semibold text-orange-600">
                            {monthData.holidayDays}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Avg Hours/Day:
                        </span>
                        <span className="font-semibold text-gray-700">
                          {formatHours(monthData.averageHoursPerDay || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Yearly Summary */}
          {yearlyData && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedYear} Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatHours(yearlyData.totalHours)}
                  </p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatHours(yearlyData.totalRegularHours)}
                  </p>
                  <p className="text-sm text-gray-600">Regular Hours</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatHours(yearlyData.totalOvertimeHours)}
                  </p>
                  <p className="text-sm text-gray-600">Overtime Hours</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(yearlyData.totalEarnings)}
                  </p>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {yearlyData.totalWorkDays}
                  </p>
                  <p className="text-sm text-gray-600">Work Days</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {yearlyData.totalHolidayDays}
                  </p>
                  <p className="text-sm text-gray-600">Holiday Days</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {formatHours(yearlyData.averageHoursPerWorkDay)}
                    </p>
                    <p className="text-sm text-gray-600">Avg Hours/Work Day</p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {formatCurrency(yearlyData.averageEarningsPerWorkDay)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg Earnings/Work Day
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {formatCurrency(yearlyData.averageMonthlyEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg Monthly Earnings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
