"use client";

import { useState } from "react";

export default function CreateAccount({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreate = async () => {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          balance: parseFloat(balance) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
      } else {
        setSuccess(`Account "${data.name}" created successfully!`);
        setName("");
        setBalance("");
        onCreated();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. SBI Savings, Cash, HDFC"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Amount (₹)
        </label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0"
          min="0"
          step="0.01"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
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

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Creating..." : "Create Account"}
      </button>
    </div>
  );
}
