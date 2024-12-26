import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    menuName: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    orderSettings: {
      delivery: {
        orderEnabled: { type: Boolean, default: true },
      },
      dineIn: {
        orderEnabled: { type: Boolean, default: true },
      },
      pickup: {
        orderEnabled: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

export const Menu = mongoose.model("Menu", menuSchema);
