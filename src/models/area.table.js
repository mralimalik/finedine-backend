import mongoose from "mongoose";
const areaTableSchema = new mongoose.Schema(
  {
    tableName: {
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
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: true,
    },
    onlineTableReservation: {
      type: Boolean,
      default: false,
    },
    minSeats: {
      type: Number,
      default:1
    },
    maxSeats: {
      type: Number,
      default:4
    },
  },
  { timestamps: true }
);

export const AreaTable = mongoose.model("AreaTable", areaTableSchema);
