"""
Quantum Support Vector Machine (QSVM) for spending pattern classification.

Uses Qiskit's ZZFeatureMap to encode financial features into quantum states
and computes the quantum kernel via statevector fidelity:
    K(x, x') = |<0| U†(x) U(x') |0>|²

Based on Havlíček et al. (2019) - "Supervised learning with quantum-enhanced
feature spaces" (Nature 567, 209–212).
"""

import numpy as np
from sklearn.svm import SVC
from sklearn.preprocessing import MinMaxScaler
from qiskit.circuit.library import ZZFeatureMap
from qiskit.quantum_info import Statevector


class QuantumSpendingClassifier:
    def __init__(self, n_features: int = 4, reps: int = 2):
        self.n_features = n_features
        self.reps = reps
        self.scaler = MinMaxScaler(feature_range=(0, np.pi))

        self.feature_map = ZZFeatureMap(
            feature_dimension=n_features,
            reps=reps,
            entanglement="linear",
        )

        self.svc = SVC(kernel="precomputed", probability=True)
        self.training_vectors = None
        self.is_trained = False

    def circuit_metadata(self) -> dict:
        """Return metadata about the quantum circuit used."""
        circ = self.feature_map.decompose()
        return {
            "num_qubits": self.feature_map.num_qubits,
            "circuit_depth": circ.depth(),
            "gate_count": circ.size(),
            "feature_map": "ZZFeatureMap",
            "reps": self.reps,
            "entanglement": "linear",
            "parameters": self.feature_map.num_parameters,
        }

    @staticmethod
    def _statevector(circuit, params: np.ndarray) -> Statevector:
        bound = circuit.assign_parameters(dict(zip(circuit.parameters, params)))
        return Statevector.from_instruction(bound)

    def _quantum_kernel(self, X1: np.ndarray, X2: np.ndarray | None = None) -> np.ndarray:
        """
        Compute the quantum kernel matrix.
        K(x_i, x_j) = |<φ(x_i)|φ(x_j)>|² where |φ(x)> = U(x)|0>
        """
        if X2 is None:
            X2 = X1
            symmetric = True
        else:
            symmetric = False

        n1, n2 = len(X1), len(X2)
        kernel = np.zeros((n1, n2))

        sv_cache_1 = [self._statevector(self.feature_map, x) for x in X1]
        sv_cache_2 = sv_cache_1 if symmetric else [
            self._statevector(self.feature_map, x) for x in X2
        ]

        for i in range(n1):
            start_j = i if symmetric else 0
            for j in range(start_j, n2):
                fidelity = np.abs(sv_cache_1[i].inner(sv_cache_2[j])) ** 2
                kernel[i][j] = fidelity
                if symmetric:
                    kernel[j][i] = fidelity

        return kernel

    @staticmethod
    def extract_features(monthly_transactions: list[list[dict]]) -> np.ndarray:
        """
        Extract 4 features per month from raw transaction lists:
          0: total_spent
          1: transaction_count
          2: category_diversity (unique categories)
          3: concentration_ratio (max single tx / total)
        """
        features = []
        for month_txs in monthly_transactions:
            debits = [t for t in month_txs if t.get("type") == "debit"]
            total = sum(t["amount"] for t in debits) if debits else 0
            n_tx = len(debits)
            cats = len({t.get("category", "Other") for t in debits})
            max_single = max((t["amount"] for t in debits), default=0)

            features.append([
                total,
                n_tx,
                cats,
                max_single / total if total > 0 else 0,
            ])
        return np.array(features, dtype=np.float64)

    @staticmethod
    def generate_labels(features: np.ndarray) -> np.ndarray:
        """Label months as high-spending (1) or normal (0) based on median."""
        totals = features[:, 0]
        median = np.median(totals)
        return (totals > median).astype(int)

    def train(self, features: np.ndarray, labels: np.ndarray) -> dict:
        X = self.scaler.fit_transform(features)
        kernel_train = self._quantum_kernel(X)
        self.svc.fit(kernel_train, labels)
        self.training_vectors = X
        self.is_trained = True

        return {
            "status": "trained",
            "samples": len(X),
            "kernel_shape": list(kernel_train.shape),
            "kernel_trace": float(np.trace(kernel_train)),
        }

    def predict(self, features: np.ndarray) -> dict:
        if not self.is_trained:
            raise RuntimeError("Model not trained yet")

        X = self.scaler.transform(features)
        kernel_pred = self._quantum_kernel(X, self.training_vectors)

        preds = self.svc.predict(kernel_pred)
        probs = self.svc.predict_proba(kernel_pred)

        results = []
        for i, (pred, prob) in enumerate(zip(preds, probs)):
            confidence = float(np.max(prob))
            label = "High Spending" if pred == 1 else "Normal"
            risk = "high" if pred == 1 else "low"
            results.append({
                "prediction": label,
                "risk_level": risk,
                "confidence": round(confidence * 100, 1),
                "probabilities": {
                    "normal": round(float(prob[0]) * 100, 1),
                    "high_spending": round(float(prob[1]) * 100, 1) if len(prob) > 1 else 0,
                },
                "features_used": {
                    "total_spent": float(features[i][0]),
                    "transaction_count": int(features[i][1]),
                    "category_diversity": int(features[i][2]),
                    "concentration_ratio": round(float(features[i][3]), 3),
                },
            })
        return results[0] if len(results) == 1 else results
