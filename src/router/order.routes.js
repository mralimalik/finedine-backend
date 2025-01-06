import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";
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
  updatePaymentStatus,
  refundOrderPayment
} from "../controllers/order.controller.js";

const orderRouter = Router();

// get dashboard order settings
orderRouter.get("/settings/:venueId", getVenueOrderSettings);
// get order details for both customer and dashbaord
orderRouter.get("/:orderId", getOrderDetails);

// create order on customer side
orderRouter.post("/createOrder/:venueId", createOrder);

// get all orders on dashboard
orderRouter.get("/liveorders/:venueId", authenticateToken, getLiveOrders);

orderRouter.get("/closedorders/:venueId", authenticateToken, getClosedOrders);

// delete order
orderRouter.delete("/:venueId/:orderId", authenticateToken, deleteOrder);

// update order settings
orderRouter.put(
  "/settings/:venueId",
  authenticateToken,
  updateVenueOrderSettings
);

// update order settings
orderRouter.put("/status/:orderId", authenticateToken, updateOrderStatus);

// update the payment status
orderRouter.put("/paymentstatus/:paymentId", updatePaymentStatus);

// refund the payment
orderRouter.put("/refund/:paymentId", refundOrderPayment);



// update order settings
orderRouter.put(
  "/ordersummary/:orderId",
  authenticateToken,
  updateOrderSummaryItem
);

export default orderRouter;
