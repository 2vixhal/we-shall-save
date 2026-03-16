"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import DashboardBox from "@/components/DashboardBox";
import DebitCreditForm from "@/components/DebitCreditForm";
import CheckBalance from "@/components/CheckBalance";
import CreateAccount from "@/components/CreateAccount";
import TransactionHistory from "@/components/TransactionHistory";

type ActiveSection = "debit-credit" | "check-balance" | "create-account" | "transactions" | null;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      !(session?.user as Record<string, unknown>)?.profileComplete
    ) {
      router.push("/complete-profile");
    }
  }, [status, session, router]);

  const handleToggle = useCallback((section: ActiveSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Finance Tracker
              </h1>
              <p className="text-sm text-gray-500">
                Welcome, {session.user.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardBox
            title="Add Debit / Credit"
            color="blue"
            isActive={activeSection === "debit-credit"}
            onClick={() => handleToggle("debit-credit")}
            icon={
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          >
            <DebitCreditForm key={`debit-${refreshKey}`} onSaved={handleDataChanged} />
          </DashboardBox>

          <DashboardBox
            title="Check Balance"
            color="green"
            isActive={activeSection === "check-balance"}
            onClick={() => handleToggle("check-balance")}
            icon={
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            }
          >
            <CheckBalance key={`balance-${refreshKey}`} />
          </DashboardBox>

          <DashboardBox
            title="Create Deposit Account"
            color="purple"
            isActive={activeSection === "create-account"}
            onClick={() => handleToggle("create-account")}
            icon={
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            }
          >
            <CreateAccount onCreated={handleDataChanged} />
          </DashboardBox>

          <DashboardBox
            title="Transaction History"
            color="amber"
            isActive={activeSection === "transactions"}
            onClick={() => handleToggle("transactions")}
            icon={
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            }
          >
            <TransactionHistory key={`txn-${refreshKey}`} onChanged={handleDataChanged} />
          </DashboardBox>
        </div>
      </main>
    </div>
  );
}
