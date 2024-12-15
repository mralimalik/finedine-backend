import mongoose from "mongoose";
// const tableSchema = new mongoose.Schema({
//     tableName: {
//       type: String,
//       required: true,
//     },
//   });
  
  
  const deliveryCustomerInfo = new mongoose.Schema({
    phoneNumber: {
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  });

  // contains order modifier data
const orderModifierSchema = new mongoose.Schema({
    quantity: {
      type: Number,
      required:true,
    },
    modifierPrice: {
      type: Number,
      required:true,
  
    },
    modifierName: {
      type: String,
      required:true,
  
    },
  });

// contains order data
const orderSummarySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },
  itemSizeName: {
    type: String,
    default: "",
  },
  itemPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  modifiers: {
    type: [orderModifierSchema],
    default: [],
  },
});

const orderSchema = new mongoose.Schema(
    {
      venueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Venue",
      },
      orderType: {
        type: String,
        required: true,
        enum: ["DELIVERY", "DINEIN"],
      },
      status: {
        type: String,
        enum: ["WAITING", "DELIVERY", "INPROGRESS", "CANCELLED", "COMPLETED"],
        default: "WAITING",
      },
      orderId: {
        type: Number,
        required: true,
      },
      orderSummary: {
        type: [orderSummarySchema],
      },
      paymentMethod: {
        type: String,
        enum: ["CARD", "CASH"],
      },
      appliedCharges:{
        type: {
            tax: { type: Number, default: 0 },
            serviceCharge: { type: Number, default: 0 },
            discount: { type: Number, default: 0 },
            delivery: { type: Number, default: 0 },
          },
      },
      // Conditional schema based on orderType
      customerInfo: {
        type: deliveryCustomerInfo,
        required: function () {
          return this.orderType === "DELIVERY"; // Required only if the order type is DELIVERY
        },
      },
      tableName: {
        type: String,
        required: function () {
          return this.orderType === "DINEIN"; // Required only if the order type is DINEIN
        },
      },
    },
    { timestamps: true }
  );


export const Order = mongoose.model("Order", orderSchema);
