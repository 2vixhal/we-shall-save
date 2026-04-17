"""
Quantum Finance API — FastAPI backend for QSVM spending analysis.
Runs real quantum circuits via Qiskit (statevector simulation).
"""

import os
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from qsvm_engine import QuantumSpendingClassifier

app = FastAPI(title="Quantum Finance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

user_models: dict[str, QuantumSpendingClassifier] = {}


class Transaction(BaseModel):
    type: str
    amount: float
    category: str | None = "Other"
    date: str | None = None


class MonthBucket(BaseModel):
    month: int
    year: int
    transactions: list[Transaction]


class AnalyzeRequest(BaseModel):
    userId: str
    monthlyData: list[MonthBucket]
    currentMonth: MonthBucket


@app.get("/health")
def health():
    clf = QuantumSpendingClassifier(n_features=4)
    return {
        "status": "ok",
        "engine": "qiskit",
        "circuit": clf.circuit_metadata(),
    }


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    try:
        if len(req.monthlyData) < 3:
            raise HTTPException(
                status_code=400,
                detail="Need at least 3 months of historical data to train QSVM.",
            )

        historical = [
            [t.model_dump() for t in mb.transactions] for mb in req.monthlyData
        ]
        current = [t.model_dump() for t in req.currentMonth.transactions]

        clf = QuantumSpendingClassifier(n_features=4, reps=2)

        hist_features = clf.extract_features(historical)
        labels = clf.generate_labels(hist_features)

        if len(set(labels)) < 2:
            mid = len(labels) // 2
            labels[:mid] = 0
            labels[mid:] = 1

        train_info = clf.train(hist_features, labels)
        user_models[req.userId] = clf

        curr_features = clf.extract_features([current])
        prediction = clf.predict(curr_features)

        meta = clf.circuit_metadata()

        return {
            "prediction": prediction,
            "training": train_info,
            "circuit": meta,
            "historicalMonths": len(req.monthlyData),
            "method": "QSVM (Quantum Support Vector Machine)",
            "kernel": "Quantum Fidelity Kernel via ZZFeatureMap",
            "backend": "Qiskit Statevector Simulation",
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
