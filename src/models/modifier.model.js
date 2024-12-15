import mongoose from "mongoose";

const modifierPriceSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: "",
  },
  price: {
    type: Number,
  },
  calories: {
    type: Number,
    default: 100,
  },
  isActive:{
    type:Boolean,
    default:true
  }
});

const modifierGroupSchema = new mongoose.Schema(
  {
    groupName: {
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

    isActive: {
      type: Boolean,
      default: true,
    },

    modifierPrices: {
      type: [modifierPriceSchema],
    },
  },
  { timestamps: true }
);

export const ModifierGroup = mongoose.model(
  "ModifierGroup",
  modifierGroupSchema
);
