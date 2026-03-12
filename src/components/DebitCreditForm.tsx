"use client";

import { useState, useEffect } from "react";

interface Account {
  _id: string;
  name: string;
  balance: number;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export default function DebitCreditForm({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
    }
  };

  const handleDiscard = () => {
    setAmount("");
    setCategory("");
    setReceivedFrom("");
    setAccountId("");
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!amount || !accountId) {
      setError("Amount and account are required");
      return;
    }

    if (mode === "debit" && !category) {
      setError("Please select a category");
      return;
    }

    if (mode === "credit" && !receivedFrom) {
      setError("Please enter who you received this from");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          amount: parseFloat(amount),
          category: mode === "debit" ? category : undefined,
          receivedFrom: mode === "credit" ? receivedFrom : undefined,
          accountId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save transaction");
      } else {
        setSuccess(
          `${mode === "debit" ? "Debit" : "Credit"} of ₹${amount} saved successfully!`
        );
        handleDiscard();
        onSaved();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => {
            setMode("debit");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
            mode === "debit"
              ? "bg-red-500 text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Debit
        </button>
        <button
          onClick={() => {
            setMode("credit");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
            mode === "credit"
              ? "bg-green-500 text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Credit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {mode === "debit" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received From
            </label>
            <input
              type="text"
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="e.g. Salary, Freelance, Friend"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          {accounts.length === 0 ? (
            <p className="text-amber-600 text-sm py-2">
              No accounts yet. Please create a deposit account first.
            </p>
          ) : (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select an account</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} (₹{acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-sm text-center bg-green-50 py-2 rounded-lg">
            {success}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDiscard}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
