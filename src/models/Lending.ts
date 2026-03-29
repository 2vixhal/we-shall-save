import mongoose, { Schema, models, model } from "mongoose";

export interface ILending {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  friend: string;
  type: "lent" | "gotback";
  accountId: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const LendingSchema = new Schema<ILending>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    friend: { type: String, required: true },
    type: { type: String, enum: ["lent", "gotback"], required: true },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "DepositAccount",
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Lending =
  models.Lending || model<ILending>("Lending", LendingSchema);
