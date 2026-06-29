"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";
import DashboardBox from "@/components/DashboardBox";
import DebitCreditForm from "@/components/DebitCreditForm";
import CheckBalance from "@/components/CheckBalance";
import CreateAccount from "@/components/CreateAccount";
import TransactionHistory from "@/components/TransactionHistory";
import InvestmentTracker from "@/components/InvestmentTracker";
import LendingTracker from "@/components/LendingTracker";
import FamilyTracker from "@/components/FamilyTracker";

type ActiveSection = "debit-credit" | "check-balance" | "create-account" | "transactions" | "investments" | "lending" | "family" | null;

const SECTION_TITLES: Record<Exclude<ActiveSection, null>, string> = {
  "debit-credit": "Add Debit / Credit",
  "check-balance": "Check Balance",
  "create-account": "Create New Account",
  "transactions": "Transaction History",
  "investments": "Investment Tracker",
  "lending": "Lending Tracker",
  "family": "Family Transfers",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && !(session?.user as Record<string, unknown>)?.profileComplete)
      router.push("/complete-profile");
  }, [status, session, router]);

  const handleToggle = useCallback((section: ActiveSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const renderContent = () => {
    switch (activeSection) {
      case "debit-credit":
        return <DebitCreditForm key={`debit-${refreshKey}`} onSaved={handleDataChanged} />;
      case "check-balance":
        return <CheckBalance key={`balance-${refreshKey}`} />;
      case "create-account":
        return <CreateAccount onCreated={handleDataChanged} />;
      case "transactions":
        return <TransactionHistory key={`txn-${refreshKey}`} onChanged={handleDataChanged} />;
      case "investments":
        return <InvestmentTracker key={`inv-${refreshKey}`} onChanged={handleDataChanged} />;
      case "lending":
        return <LendingTracker key={`lend-${refreshKey}`} onChanged={handleDataChanged} />;
      case "family":
        return <FamilyTracker key={`fam-${refreshKey}`} onChanged={handleDataChanged} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
      <header className="bg-white dark:bg-stone-800 border-b border-stone-200/80 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 dark:bg-amber-700 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-amber-400 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight">Finance Tracker</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">Welcome, {session.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer text-stone-500 dark:text-stone-400"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <button onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 font-semibold transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          <DashboardBox title="Debit / Credit" color="terracotta" isActive={activeSection === "debit-credit"} onClick={() => handleToggle("debit-credit")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
          <DashboardBox title="Balance" color="sage" isActive={activeSection === "check-balance"} onClick={() => handleToggle("check-balance")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} />
          <DashboardBox title="New Account" color="teal" isActive={activeSection === "create-account"} onClick={() => handleToggle("create-account")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
          <DashboardBox title="Transactions" color="clay" isActive={activeSection === "transactions"} onClick={() => handleToggle("transactions")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
          <DashboardBox title="Investments" color="amber" isActive={activeSection === "investments"} onClick={() => handleToggle("investments")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
          <DashboardBox title="Lending" color="slate" isActive={activeSection === "lending"} onClick={() => handleToggle("lending")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
          <DashboardBox title="Family" color="pink" isActive={activeSection === "family"} onClick={() => handleToggle("family")}
            icon={<svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        </div>

        {activeSection && (
          <div className="mt-6 animate-[fadeIn_0.3s_ease-in-out]">
            <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-md border border-stone-200/60 dark:border-stone-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">{SECTION_TITLES[activeSection]}</h3>
              </div>
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
