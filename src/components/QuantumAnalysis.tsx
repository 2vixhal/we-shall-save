"use client";

import { useState } from "react";

interface QSVMResult {
  prediction: {
    prediction: string;
    risk_level: string;
    confidence: number;
    probabilities: { normal: number; high_spending: number };
    features_used: {
      total_spent: number;
      transaction_count: number;
      category_diversity: number;
      concentration_ratio: number;
    };
  };
  training: {
    samples: number;
    kernel_shape: number[];
    kernel_trace: number;
  };
  circuit: {
    num_qubits: number;
    circuit_depth: number;
    gate_count: number;
    feature_map: string;
    reps: number;
    entanglement: string;
    parameters: number;
  };
  historicalMonths: number;
  method: string;
  kernel: string;
  backend: string;
}

export default function QuantumAnalysis() {
  const [result, setResult] = useState<QSVMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quantum/analyze");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isHigh = result?.prediction.risk_level === "high";

  return (
    <div className="mt-5">
      <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/30 flex items-center justify-center text-lg">
            ⚛
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">
              Quantum Spending Prediction
            </h3>
            <p className="text-[10px] text-violet-300">
              QSVM · ZZFeatureMap · Fidelity Kernel
            </p>
          </div>
        </div>

        {!result && !loading && !error && (
          <div className="text-center py-4">
            <p className="text-xs text-violet-300 mb-3">
              Runs a real Quantum Support Vector Machine on your spending history
              using Qiskit quantum circuits.
            </p>
            <button
              onClick={runAnalysis}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
            >
              Run QSVM Analysis
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <div className="inline-block w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-violet-300">
              Running quantum circuits...
            </p>
            <p className="text-[10px] text-violet-400 mt-1">
              Computing quantum kernel via statevector fidelity
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-2">
            <p className="text-xs text-red-300">{error}</p>
            <button
              onClick={runAnalysis}
              className="mt-2 text-xs text-red-200 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
            {/* Prediction result */}
            <div
              className={`rounded-xl p-4 border ${
                isHigh
                  ? "bg-red-500/15 border-red-500/30"
                  : "bg-emerald-500/15 border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-violet-300 uppercase tracking-wider font-semibold mb-1">
                    Current Month Prediction
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      isHigh ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {result.prediction.prediction}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-violet-300 mb-1">Confidence</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {result.prediction.confidence}%
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-violet-400 mb-1">
                  <span>Normal {result.prediction.probabilities.normal}%</span>
                  <span>
                    High {result.prediction.probabilities.high_spending}%
                  </span>
                </div>
                <div className="h-2 bg-violet-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-red-500 rounded-full transition-all"
                    style={{
                      width: `${result.prediction.probabilities.high_spending}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Features used */}
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Total Spent",
                  value: `₹${result.prediction.features_used.total_spent.toLocaleString()}`,
                },
                {
                  label: "Transactions",
                  value: result.prediction.features_used.transaction_count,
                },
                {
                  label: "Categories",
                  value: result.prediction.features_used.category_diversity,
                },
                {
                  label: "Concentration",
                  value: `${(result.prediction.features_used.concentration_ratio * 100).toFixed(1)}%`,
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="bg-violet-800/30 rounded-lg p-2.5 border border-violet-700/30"
                >
                  <p className="text-[10px] text-violet-400">{f.label}</p>
                  <p className="text-sm font-bold">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Quantum details toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs text-violet-400 hover:text-violet-300 font-medium py-1.5 flex items-center justify-center gap-1 cursor-pointer"
            >
              {showDetails ? "Hide" : "Show"} Quantum Circuit Details
              <svg
                className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDetails && (
              <div className="bg-violet-950/50 rounded-lg p-3 border border-violet-800/40 space-y-2 text-xs animate-[fadeIn_0.2s_ease-in-out]">
                <p className="text-violet-300 font-semibold uppercase tracking-wider text-[10px] mb-2">
                  Quantum Circuit Specification
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ["Qubits", result.circuit.num_qubits],
                    ["Circuit Depth", result.circuit.circuit_depth],
                    ["Gate Count", result.circuit.gate_count],
                    ["Parameters", result.circuit.parameters],
                    ["Feature Map", result.circuit.feature_map],
                    ["Reps", result.circuit.reps],
                    ["Entanglement", result.circuit.entanglement],
                    ["Training Months", result.historicalMonths],
                    [
                      "Kernel Matrix",
                      `${result.training.kernel_shape[0]}×${result.training.kernel_shape[1]}`,
                    ],
                    ["Kernel Trace", result.training.kernel_trace.toFixed(2)],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between">
                      <span className="text-violet-400">{k}</span>
                      <span className="text-violet-200 font-mono font-medium">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-violet-800/30">
                  <p className="text-violet-400">
                    <span className="font-semibold text-violet-300">Method:</span>{" "}
                    {result.method}
                  </p>
                  <p className="text-violet-400 mt-0.5">
                    <span className="font-semibold text-violet-300">Kernel:</span>{" "}
                    {result.kernel}
                  </p>
                  <p className="text-violet-400 mt-0.5">
                    <span className="font-semibold text-violet-300">Backend:</span>{" "}
                    {result.backend}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={runAnalysis}
              className="w-full text-xs text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
            >
              ↻ Re-run Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
