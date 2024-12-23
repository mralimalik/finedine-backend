import mongoose from "mongoose";

const itemPriceSchema = mongoose.Schema({
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
});

const menuItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      default: 1,
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
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuSection",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["ITEM"],
      default: "ITEM",
    },
    price: {
      type: [itemPriceSchema],
    },
    image: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isSold: {
      type: Boolean,
      default: false,
    },
    labels:[
      {
        type:[String],
        default:[]
      }
    ],
    modifiers: [
      {
        modifierId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ModifierGroup", 
          required: true,
        },
        min: {
          type: Number,
          default: 0,
        },
        max: {
          type: Number,
          default: 1,
        },
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
