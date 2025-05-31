import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function HolidayCalendar() {
  const [selectedDate, setSelectedDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayDescription, setHolidayDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const addHoliday = useMutation(api.holidays.add);
  const removeHoliday = useMutation(api.holidays.remove);
  const monthHolidays = useQuery(api.holidays.getMonthHolidays, {
    year: currentYear,
    month: currentMonth,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !holidayName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addHoliday({
        date: new Date(selectedDate).getTime(),
        name: holidayName.trim(),
        description: holidayDescription.trim(),
      });

      toast.success("Holiday added successfully!");
      
      // Reset form
      setSelectedDate("");
      setHolidayName("");
      setHolidayDescription("");
      setShowForm(false);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        toast.error("Holiday already exists for this date");
      } else {
        toast.error("Failed to add holiday");
      }
    }
  };

  const handleDelete = async (holidayId: string, holidayName: string) => {
    if (confirm(`Are you sure you want to delete "${holidayName}"?`)) {
      try {
        await removeHoliday({ id: holidayId as any });
        toast.success("Holiday deleted successfully");
      } catch (error) {
        toast.error("Failed to delete holiday");
      }
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isHolidayDate = (date: number) => {
    const dateTime = new Date(currentYear, currentMonth, date).getTime();
    return monthHolidays?.find(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getDate() === date &&
             holidayDate.getMonth() === currentMonth &&
             holidayDate.getFullYear() === currentYear;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-600 mt-1">Mark your non-working holiday days</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "Add Holiday"}
        </button>
      </div>

      {/* Add Holiday Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Holiday</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Name
              </label>
              <input
                type="text"
                id="name"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g., Christmas, New Year, Personal Day"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                id="description"
                value={holidayDescription}
                onChange={(e) => setHolidayDescription(e.target.value)}
                placeholder="Additional notes about this holiday"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Holiday
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {emptyDays.map(day => (
              <div key={`empty-${day}`} className="p-2 h-12"></div>
            ))}
            
            {/* Days of the month */}
            {days.map(day => {
              const holiday = isHolidayDate(day);
              const isToday = new Date().getDate() === day && 
                             new Date().getMonth() === currentMonth && 
                             new Date().getFullYear() === currentYear;
              
              return (
                <div
                  key={day}
                  className={`p-2 h-12 border rounded-md text-center text-sm relative ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  } ${holiday ? 'bg-red-50 border-red-200' : ''}`}
                >
                  <span className={`${holiday ? 'text-red-700 font-semibold' : 'text-gray-900'}`}>
                    {day}
                  </span>
                  {holiday && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Holiday List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Holidays in {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        {monthHolidays === undefined ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : monthHolidays.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No holidays marked for this month</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {monthHolidays
              .sort((a, b) => a.date - b.date)
              .map((holiday) => (
                <div key={holiday._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{holiday.name}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(holiday.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {holiday.description && (
                            <p className="text-sm text-gray-600 mt-1">{holiday.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(holiday._id, holiday.name)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete holiday"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
