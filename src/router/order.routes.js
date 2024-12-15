import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";
import { getVenueOrderSettings,updateVenueOrderSettings,createOrder,getOrderDetails } from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.get("/settings/:venueId", getVenueOrderSettings);
orderRouter.get("/:orderId", getOrderDetails);

orderRouter.post("/createOrder/:venueId", createOrder);

orderRouter.put("/settings/:venueId", authenticateToken,updateVenueOrderSettings);



export default orderRouter;
