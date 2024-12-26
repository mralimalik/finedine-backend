import mongoose from "mongoose";
const venueSchema = new mongoose.Schema(
  {
    venueName: {
      type: String,
      required: true,
      trim: true,
    },
    venueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image:{
      type: String,
      default:'',
    }
  },
  { timestamps: true }
);

export const Venue = mongoose.model("Venue", venueSchema);
