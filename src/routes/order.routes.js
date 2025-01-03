
import express from "express";
import {
  getVenueOrderSettings,
  updateVenueOrderSettings,
  createOrder,
  getOrderDetails,
  getLiveOrders,
  getClosedOrders,
  deleteOrder,
  updateOrderStatus,
  updateOrderSummaryItem,
  processCardPayment,
} from "../controllers/order.controller.js";

const router = express.Router();

// Fetch order settings by venue ID
router.get("/settings/:venueId", getVenueOrderSettings);

// Update order settings
router.put("/settings/:venueId", updateVenueOrderSettings);

// Create a new order
router.post("/:venueId/order", createOrder);

// Get order details by orderId or object _id
router.get("/order/:orderId", getOrderDetails);

// Get live orders for a venue
router.get("/:venueId/live-orders", getLiveOrders);

// Get closed orders for a venue
router.get("/:venueId/closed-orders", getClosedOrders);

// Delete a specific order
router.delete("/:venueId/order/:orderId", deleteOrder);

// Update order status
router.put("/order/:orderId/status", updateOrderStatus);

// Update order summary by deleting an item by _id
router.put("/order/:orderId/summary", updateOrderSummaryItem);


export default router;