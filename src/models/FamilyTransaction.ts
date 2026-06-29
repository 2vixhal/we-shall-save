import mongoose, { Schema, models, model } from "mongoose";

export interface IFamilyTransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "debit" | "credit";
  amount: number;
  member: string;
  accountId: mongoose.Types.ObjectId;
  note?: string;
  date: Date;
  createdAt: Date;
}

const FamilyTransactionSchema = new Schema<IFamilyTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["debit", "credit"], required: true },
    amount: { type: Number, required: true },
    member: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "DepositAccount", required: true },
    note: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const FamilyTransaction =
  models.FamilyTransaction ||
  model<IFamilyTransaction>("FamilyTransaction", FamilyTransactionSchema);
