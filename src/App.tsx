// import {
//   Authenticated,
//   Unauthenticated,
//   useQuery,
//   useMutation,
// } from "convex/react";
// import { api } from "../convex/_generated/api";
// import { SignInForm } from "./SignInForm";
// import { SignOutButton } from "./SignOutButton";
// import { Toaster } from "sonner";
// import { useEffect, useState } from "react";
// import { TransactionList } from "./components/TransactionList";
// import { Dashboard } from "./components/Dashboard";
// import { CategoriesPage } from "./components/CategoriesPage";
// import { WorkTracker } from "./components/WorkTracker";
// import { HolidayCalendar } from "./components/HolidayCalendar";

// export default function App() {
//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
//         <h2 className="text-lg sm:text-xl font-semibold text-primary truncate">
//           Personal Finance Manager
//         </h2>
//         <SignOutButton />
//       </header>
//       <main className="flex-1 p-4 sm:p-6">
//         <Content />
//       </main>
//       <Toaster />
//     </div>
//   );
// }

// function Content() {
//   const loggedInUser = useQuery(api.auth.loggedInUser);
//   const initializeCategories = useMutation(
//     api.categories.initializeDefaultCategories
//   );
//   const [activeTab, setActiveTab] = useState<
//     "dashboard" | "transactions" | "categories" | "work" | "holidays"
//   >("dashboard");

//   useEffect(() => {
//     if (loggedInUser) {
//       initializeCategories().catch((error) => {
//         console.log('"Failed to initialize categories:"', error);
//       });
//     }
//   }, [loggedInUser, initializeCategories]);

//   if (loggedInUser === undefined) {
//     return (
//       <div className="flex justify-center items-center min-h-[400px]">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       <Authenticated>
//         <div className="mb-6">
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
//             Welcome back, {loggedInUser?.email?.split("@")[0]}!
//           </h1>
//           <p className="text-gray-600">
//             Manage your finances and track your spending
//           </p>
//         </div>

//         {/* Navigation Tabs */}
//         <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-full overflow-x-auto">
//           <button
//             onClick={() => setActiveTab("dashboard")}
//             className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
//               activeTab === "dashboard"
//                 ? "bg-white text-blue-600 shadow-sm"
//                 : "text-gray-600 hover:text-gray-900"
//             }`}
//           >
//             Dashboard
//           </button>
//           <button
//             onClick={() => setActiveTab("transactions")}
//             className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
//               activeTab === "transactions"
//                 ? "bg-white text-blue-600 shadow-sm"
//                 : "text-gray-600 hover:text-gray-900"
//             }`}
//           >
//             Transactions
//           </button>
//           <button
//             onClick={() => setActiveTab("work")}
//             className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
//               activeTab === "work"
//                 ? "bg-white text-blue-600 shadow-sm"
//                 : "text-gray-600 hover:text-gray-900"
//             }`}
//           >
//             Work Tracker
//           </button>
//           <button
//             onClick={() => setActiveTab("holidays")}
//             className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
//               activeTab === "holidays"
//                 ? "bg-white text-blue-600 shadow-sm"
//                 : "text-gray-600 hover:text-gray-900"
//             }`}
//           >
//             Holidays
//           </button>
//           <button
//             onClick={() => setActiveTab("categories")}
//             className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
//               activeTab === "categories"
//                 ? "bg-white text-blue-600 shadow-sm"
//                 : "text-gray-600 hover:text-gray-900"
//             }`}
//           >
//             Categories
//           </button>
//         </div>

//         {/* Tab Content */}
//         {activeTab === "dashboard" && <Dashboard />}
//         {activeTab === "transactions" && <TransactionList />}
//         {activeTab === "work" && <WorkTracker />}
//         {activeTab === "holidays" && <HolidayCalendar />}
//         {activeTab === "categories" && <CategoriesPage />}
//       </Authenticated>

//       <Unauthenticated>
//         <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">
//             Personal Finance Manager
//           </h1>
//           <p className="text-xl text-gray-600 mb-8">
//             Track your income, expenses, and financial goals
//           </p>
//           <div className="w-full max-w-md">
//             <SignInForm />
//           </div>
//         </div>
//       </Unauthenticated>
//     </div>
//   );
// }

import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useEffect, useState, useCallback, useMemo } from "react";
import { TransactionList } from "./components/TransactionList";
import { Dashboard } from "./components/Dashboard";
import { CategoriesPage } from "./components/CategoriesPage";
import { WorkTracker } from "./components/WorkTracker";
import { HolidayCalendar } from "./components/HolidayCalendar";

// Type definition for better type safety
type TabType =
  | "dashboard"
  | "transactions"
  | "categories"
  | "work"
  | "holidays";

// Configuration for tabs to reduce repetition
const TAB_CONFIG: Array<{ key: TabType; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "transactions", label: "Transactions" },
  { key: "work", label: "Work Tracker" },
  { key: "holidays", label: "Holidays" },
  { key: "categories", label: "Categories" },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

// Extracted Header component for better organization
function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
      <h2 className="text-lg sm:text-xl font-semibold text-primary truncate">
        Personal Finance Manager
      </h2>
      <SignOutButton />
    </header>
  );
}

// Loading component for reusability
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// Navigation tabs component
function NavigationTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <nav className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-full overflow-x-auto">
      {TAB_CONFIG.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === key
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          aria-pressed={activeTab === key}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

// Tab content renderer
function TabContent({ activeTab }: { activeTab: TabType }) {
  // Use useMemo to prevent unnecessary re-renders of components
  const content = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "transactions":
        return <TransactionList />;
      case "work":
        return <WorkTracker />;
      case "holidays":
        return <HolidayCalendar />;
      case "categories":
        return <CategoriesPage />;
      default:
        return <Dashboard />;
    }
  }, [activeTab]);

  return content;
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const initializeCategories = useMutation(
    api.categories.initializeDefaultCategories
  );
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Memoize the tab change handler to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Memoize the user's display name
  const displayName = useMemo(() => {
    return loggedInUser?.email?.split("@")[0] || "User";
  }, [loggedInUser?.email]);

  // Initialize categories when user logs in
  useEffect(() => {
    if (loggedInUser) {
      initializeCategories().catch((error) => {
        console.error("Failed to initialize categories:", error);
      });
    }
  }, [loggedInUser, initializeCategories]);

  // Show loading state
  if (loggedInUser === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <WelcomeSection displayName={displayName} />
        <NavigationTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <TabContent activeTab={activeTab} />
      </Authenticated>

      <Unauthenticated>
        <UnauthenticatedView />
      </Unauthenticated>
    </div>
  );
}

// Welcome section component
function WelcomeSection({ displayName }: { displayName: string }) {
  return (
    <section className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {displayName}!
      </h1>
      <p className="text-gray-600">
        Manage your finances and track your spending
      </p>
    </section>
  );
}

// Unauthenticated view component
function UnauthenticatedView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Personal Finance Manager
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Track your income, expenses, and financial goals
      </p>
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}
