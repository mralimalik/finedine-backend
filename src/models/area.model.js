import mongoose from "mongoose";
const areaSchema = new mongoose.Schema(
  {
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    // onlineReservation: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  { timestamps: true }
);

export const Area = mongoose.model("Area", areaSchema);
