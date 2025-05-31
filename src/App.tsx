import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { TransactionList } from "./components/TransactionList";
import { Dashboard } from "./components/Dashboard";
import { CategoriesPage } from "./components/CategoriesPage";
import { WorkTracker } from "./components/WorkTracker";
import { HolidayCalendar } from "./components/HolidayCalendar";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-lg sm:text-xl font-semibold text-primary truncate">Personal Finance Manager</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const initializeCategories = useMutation(api.categories.initializeDefaultCategories);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "categories" | "work" | "holidays">("dashboard");

  useEffect(() => {
    if (loggedInUser) {
      initializeCategories();
    }
  }, [loggedInUser, initializeCategories]);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {loggedInUser?.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-600">Manage your finances and track your spending</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === "transactions"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("work")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === "work"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Work Tracker
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === "holidays"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Holidays
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Categories
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "transactions" && <TransactionList />}
        {activeTab === "work" && <WorkTracker />}
        {activeTab === "holidays" && <HolidayCalendar />}
        {activeTab === "categories" && <CategoriesPage />}
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Personal Finance Manager</h1>
          <p className="text-xl text-gray-600 mb-8">Track your income, expenses, and financial goals</p>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
