"use client";

import { useState, useEffect, useCallback } from "react";

interface Account {
  _id: string;
  name: string;
  balance: number;
}

interface TransactionItem {
  _id: string;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  receivedFrom?: string;
  accountId: { _id: string; name: string } | string;
  createdAt: string;
}

const CATEGORIES = [
  "Food",
  "Petrol",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Clothing",
  "UPI Lite",
  "Other",
];

export default function TransactionHistory({
  onChanged,
}: {
  onChanged: () => void;
}) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    type: "debit" as "debit" | "credit",
    amount: "",
    category: "",
    customCategory: "",
    receivedFrom: "",
    accountId: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/accounts"),
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAccountName = (accountId: TransactionItem["accountId"]) => {
    if (typeof accountId === "object" && accountId?.name) return accountId.name;
    const acc = accounts.find((a) => a._id === accountId);
    return acc?.name || "Unknown";
  };

  const getAccountId = (accountId: TransactionItem["accountId"]) => {
    if (typeof accountId === "object") return accountId._id;
    return accountId;
  };

  const startEdit = (tx: TransactionItem) => {
    const isPreset = CATEGORIES.includes(tx.category || "");
    setEditingId(tx._id);
    setEditForm({
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.type === "debit" ? (isPreset ? tx.category || "" : "Other") : "",
      customCategory: tx.type === "debit" && !isPreset ? tx.category || "" : "",
      receivedFrom: tx.receivedFrom || "",
      accountId: getAccountId(tx.accountId),
    });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError("");
  };

  const saveEdit = async () => {
    setError("");

    const finalCategory =
      editForm.type === "debit"
        ? editForm.category === "Other"
          ? editForm.customCategory.trim()
          : editForm.category
        : undefined;

    if (!editForm.amount || !editForm.accountId) {
      setError("Amount and account are required");
      return;
    }
    if (editForm.type === "debit" && !finalCategory) {
      setError("Please select or enter a category");
      return;
    }
    if (editForm.type === "credit" && !editForm.receivedFrom.trim()) {
      setError("Please enter who you received this from");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editForm.type,
          amount: parseFloat(editForm.amount),
          category: finalCategory,
          receivedFrom:
            editForm.type === "credit" ? editForm.receivedFrom.trim() : undefined,
          accountId: editForm.accountId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }

      setEditingId(null);
      await fetchData();
      onChanged();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        onChanged();
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-500">
        Loading transactions...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="text-sm mt-1">
          Add a debit or credit to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {transactions.length} transaction{transactions.length !== 1 && "s"}
      </p>

      {error && editingId && (
        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
          {error}
        </p>
      )}

      {transactions.map((tx) => (
        <div key={tx._id}>
          {editingId === tx._id ? (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-amber-400 space-y-3">
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() =>
                    setEditForm((f) => ({ ...f, type: "debit", receivedFrom: "", category: "", customCategory: "" }))
                  }
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    editForm.type === "debit"
                      ? "bg-red-500 text-white"
                      : "text-gray-600"
                  }`}
                >
                  Debit
                </button>
                <button
                  onClick={() =>
                    setEditForm((f) => ({ ...f, type: "credit", category: "", customCategory: "" }))
                  }
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    editForm.type === "credit"
                      ? "bg-green-500 text-white"
                      : "text-gray-600"
                  }`}
                >
                  Credit
                </button>
              </div>

              <input
                type="number"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="Amount"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {editForm.type === "debit" ? (
                <>
                  <select
                    value={editForm.category}
                    onChange={(e) => {
                      setEditForm((f) => ({
                        ...f,
                        category: e.target.value,
                        customCategory: e.target.value !== "Other" ? "" : f.customCategory,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {editForm.category === "Other" && (
                    <input
                      type="text"
                      value={editForm.customCategory}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, customCategory: e.target.value }))
                      }
                      placeholder="Type your expense category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={editForm.receivedFrom}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, receivedFrom: e.target.value }))
                  }
                  placeholder="Received from"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}

              <select
                value={editForm.accountId}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, accountId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === "debit" ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  <span
                    className={`text-lg font-bold ${
                      tx.type === "debit" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {tx.type === "debit" ? "−" : "+"}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        tx.type === "debit" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {tx.type === "debit" ? "−" : "+"}₹
                      {tx.amount.toLocaleString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                      {tx.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {tx.type === "debit"
                      ? tx.category
                      : `From: ${tx.receivedFrom}`}{" "}
                    &middot; {getAccountName(tx.accountId)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => startEdit(tx)}
                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => deleteTransaction(tx._id)}
                  disabled={deletingId === tx._id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Delete"
                >
                  <svg
                    className="w-4 h-4"
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
          )}
        </div>
      ))}
    </div>
  );
}
