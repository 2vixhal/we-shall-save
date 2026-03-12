import mongoose, { Schema, models, model } from "mongoose";

export interface IDepositAccount {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  balance: number;
  createdAt: Date;
}

const DepositAccountSchema = new Schema<IDepositAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const DepositAccount =
  models.DepositAccount ||
  model<IDepositAccount>("DepositAccount", DepositAccountSchema);
