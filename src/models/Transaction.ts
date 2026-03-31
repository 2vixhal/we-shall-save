import mongoose, { Schema, models, model } from "mongoose";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  receivedFrom?: string;
  accountId: mongoose.Types.ObjectId;
  date: Date;
  note?: string;
  salaryMonth?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["debit", "credit"], required: true },
    amount: { type: Number, required: true },
    category: { type: String },
    receivedFrom: { type: String },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "DepositAccount",
      required: true,
    },
    date: { type: Date, default: Date.now },
    note: { type: String },
    salaryMonth: { type: String },
  },
  { timestamps: true }
);

export const Transaction =
  models.Transaction ||
  model<ITransaction>("Transaction", TransactionSchema);
