import mongoose from "mongoose";

const extraChargesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
    },
    chargesType: {
      type: String,
      enum: ["DISCOUNT", "SERVICE", "TAXES"],
    },

    isActive: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0.0,
    },
    amountType: {
      type: String,
      default: 0.0,
      enum:["PERCENT","NUMBER"]
    },
  },
  { timestamps: true }
);

export const ExtraCharge = mongoose.model("ExtraCharge", extraChargesSchema);
