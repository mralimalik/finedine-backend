import { OrderSetting } from "../models/order.setting.model.js";
import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
// Fetch order settings by venue ID
const getVenueOrderSettings = async (req, res) => {
  try {
    // Get venueId from request parameters
    const { venueId } = req.params;

    // Validate venueId
    if (!venueId) {
      return res.status(400).json({ message: "Venue _iD is required." });
    }

    // Convert venueId to ObjectId
    const objectId =new mongoose.Types.ObjectId(venueId);

    // Query the database for order settings related to the venueId
    const settings = await OrderSetting.findOne({ venueId: objectId });

    // Return the settings
    return res.status(200).json({ data: settings });
  } catch (error) {
    // Handle any errors
    console.error("Error fetching venue order settings:", error);
    return res
      .status(500)
      .json({
        message: "An error occurred while fetching order settings.",
        error,
      });
  }
};


const updateVenueOrderSettings = async (req, res) => {
  try {
    const { venueId } = req.params; 
    const { type, updateData } = req.body; 

    // Validate venueId
    if (!venueId) {
      return res.status(400).json({ message: "VenueId is required." });
    }

    // Validate type
    const validTypes = ["delivery", "pickup", "dineIn"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        message: `Invalid or missing type. Valid types are: ${validTypes.join(", ")}`,
      });
    }

    // Validate updateData
    if (!updateData || typeof updateData !== "object") {
      return res
        .status(400)
        .json({ message: "Update data is required and must be an object." });
    }

    // Convert venueId to ObjectId
    const objectId = new mongoose.Types.ObjectId(venueId);

    // Find the order settings for the venue
    const settings = await OrderSetting.findOne({ venueId: objectId });

    if (!settings) {
      return res
        .status(404)
        .json({ message: "Order settings not found for the given venueId." });
    }

    // Update the specific type settings dynamically
    settings.settings[type] = { ...settings.settings[type], ...updateData };

    // Save the updates back to the database
    const updatedOrderSetting = await settings.save();

    // Respond with the updated document
    return res.status(200).json({
      message: `${type} settings updated successfully.`,
      data: updatedOrderSetting,
    });
  } catch (error) {
    console.error("Error updating order settings:", error);
    return res.status(500).json({
      message: "An error occurred while updating order settings.",
      error,
    });
  }
};



const createOrder = async (req, res) => {
  const { venueId } = req.params; // Get venueId from URL parameter
  const {
    orderType,
    orderSummary,
    paymentMethod,
    customerInfo, // customer info for delivery orders
    tableName,   // table info for dine-in orders
    appliedCharges
  } = req.body;

  try {

    console.log("tablename",tableName);
    
    // Validate that the orderType is either "DELIVERY" or "DINEIN"
    if (!["DELIVERY", "DINEIN"].includes(orderType)) {
      return res.status(400).json({ message: "Invalid order type" });
    }

    // Validate orderSummary structure
    if (!Array.isArray(orderSummary) || orderSummary.length === 0) {
      return res.status(400).json({ message: "Order summary must be a non-empty array" });
    }

    for (let item of orderSummary) {
      if (!item.itemName || !item.itemPrice || !item.quantity) {
        return res.status(400).json({ message: "Each order summary item must contain itemName, itemPrice, and quantity" });
      }
      
      // Validate each modifier
      item.modifiers?.forEach((modifier) => {
        if (!modifier.modifierName || !modifier.modifierPrice) {
          return res.status(400).json({ message: "Each modifier must contain modifierName and modifierPrice" });
        }
      });
    }


    // Find the last order and increment its orderId
    const lastOrder = await Order.findOne().sort({ orderId: -1 }).limit(1);

    // Set orderId to 1001 if no orders exist, otherwise increment the last orderId by 1
    const orderId = lastOrder ? lastOrder.orderId + 1 : 1001;

    // Create the order document based on the order type
    const newOrder = new Order({
      venueId: venueId, // venueId passed as URL parameter
      orderType: orderType,
      orderId: orderId,
      orderSummary: orderSummary,
      paymentMethod: paymentMethod,
      appliedCharges:appliedCharges,
      customerInfo: orderType === "DELIVERY" ? customerInfo : undefined, // Include delivery info only if orderType is DELIVERY
      tableName: orderType === "DINEIN" ? tableName : undefined,     // Include dinein info only if orderType is DINEIN
    });

    // Save the new order to the database
    await newOrder.save();

    // Respond with the created order
    res.status(200).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getOrderDetails = async (req, res) => {
  const { orderId } = req.params; // Extract orderId from request parameters

  try {
    // Validate the orderId
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }
    // Build the query dynamically based on whether `orderId` is numeric or an ObjectId
    let query = {};

    if (!isNaN(orderId)) {
      // If orderId is numeric
      query = { orderId: parseInt(orderId) };
    } else if (mongoose.isValidObjectId(orderId)) {
      // If orderId is a valid ObjectId
      query = { _id: orderId };
    } else {
      return res.status(400).json({ message: "Invalid Order ID format." });
    }

    // Query the database for the order
    const order = await Order.findOne(query);

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Return the order details
    return res.status(200).json({ message: "Order details fetched successfully.", data: order });
  } catch (error) {
    // Handle any errors
    console.error("Error fetching order details:", error);
    return res.status(500).json({
      message: "An error occurred while fetching order details.",
      error,
    });
  }
};





export {getVenueOrderSettings,updateVenueOrderSettings,createOrder,getOrderDetails}


