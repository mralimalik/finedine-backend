import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";

import {
  getAllVenuesByUser,
  getVenueById,
  updateVenueById,
  createVenue,
  getVenueDataForQr,
  addExtraCharges,
  deleteExtraCharges,
  getExtraChargesByVenueId,
} from "../controllers/venue.controller.js";
import { upload } from "../middleware/image_upload.js";

const venueRouter = Router();

venueRouter.get("/", authenticateToken, getAllVenuesByUser);
venueRouter.get("/:venueId", authenticateToken, getVenueById);

venueRouter.put("/update/:venueId", authenticateToken, upload.single('image'),updateVenueById);
venueRouter.post("/createVenue", authenticateToken, createVenue);
venueRouter.post("/extraCharges/:venueId", authenticateToken, addExtraCharges);
venueRouter.post("/delete/extraCharges", authenticateToken, deleteExtraCharges);

venueRouter.get("/qr/:venueId", getVenueDataForQr);
venueRouter.get("/:extraCharges/:venueId", getExtraChargesByVenueId);


export default venueRouter;
