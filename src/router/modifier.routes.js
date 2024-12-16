import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";
import {
  createModifier,
  getModifiersByVenue,
  deleteModifier,
  getItemModifiers
} from "../controllers/modifier.controller.js";

const modifierRouter = Router();

modifierRouter.get("/:itemId", getItemModifiers);


modifierRouter.post("/delete", authenticateToken, deleteModifier);

modifierRouter.post("/:venueId", authenticateToken, createModifier);
modifierRouter.get("/getmodifier/:venueId", authenticateToken, getModifiersByVenue);

export default modifierRouter;
