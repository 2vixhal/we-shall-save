import mongoose, { Schema, models, model } from "mongoose";

export interface IInvestment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  subCategory?: string;
  note?: string;
  accountId: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    note: { type: String },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "DepositAccount",
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Investment =
  models.Investment || model<IInvestment>("Investment", InvestmentSchema);
