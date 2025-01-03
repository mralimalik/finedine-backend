import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
  orderEnabled: {
    type: Boolean,
    default: false,
  },
  tipEnabled: {
    type: Boolean,
    default: false,
  },
  tipAmount: {
    type: Number,
    default: 0,
  },
  paymentOptions: {
    type: {
      cardPayment: { type: Boolean, default: true },
      cashPayment: { type: Boolean, default: true },
    },
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  deliveryTime: {
    type: String,
    default: "45 min",
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
  },
  paymentEnabled:{
    type:Boolean,
    default:false
  },
});
const pickUpSchema = new mongoose.Schema({
  orderEnabled: {
    type: Boolean,
    default: false,
  },
  tipEnabled: {
    type: Boolean,
    default: false,
  },
  tipAmount: {
    type: Number,
    default: 0,
  },
  paymentEnabled:{
    type:Boolean,
    default:false
  },
  paymentOptions: {
    type: {
      cardPayment: { type: Boolean, default: true },
      cashPayment: { type: Boolean, default: true },
    },
  },

  deliveryFee: {
    type: Number,
    default: 0,
  },
  showPreparationTime: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: String,
    default: "45 min",
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
  },
});

const dineInSchema = new mongoose.Schema({
  paymentEnabled:{
    type:Boolean,
    default:false
  },
  orderEnabled: {
    type: Boolean,
    default: true,
  },
  tipEnabled: {
    type: Boolean,
    default: false,
  },
  tipAmount: {
    type: Number,
    default: 0,
  },
  paymentOptions: {
    type: {
      cardPayment: { type: Boolean, default: true },
      cashPayment: { type: Boolean, default: true },
    },
  }
});

const orderSettingSchema = new mongoose.Schema(
  {
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
    },
    orderEmails: {
      type: [String],
      default: [],
    },
    settings: {
      delivery: { type: deliverySchema , default:{} },
      pickup: { type: pickUpSchema,default:{} },
      dineIn: { type: dineInSchema ,default:{}},
    },
  },
  { timestamps: true }
);

export const OrderSetting = mongoose.model("OrderSetting", orderSettingSchema);
