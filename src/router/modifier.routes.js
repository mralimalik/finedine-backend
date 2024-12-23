import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";
import {
  createModifier,
  getModifiersByVenue,
  deleteModifier,
  getItemModifiers,
  removeModifierPrices,
  updateModifier
} from "../controllers/modifier.controller.js";

const modifierRouter = Router();

// get modifer of item in which it is used
modifierRouter.get("/:itemId", getItemModifiers);

// to delete the whole mdoifer group
modifierRouter.post("/delete", authenticateToken, deleteModifier);

// to create new modifier with their prices
modifierRouter.post("/:venueId", authenticateToken, createModifier);
// to get modifers by venue
modifierRouter.get("/getmodifier/:venueId", authenticateToken, getModifiersByVenue);


// to remove th modifier prices from specific group
modifierRouter.post("/:modifierGroupId", authenticateToken, removeModifierPrices);


// to update the modifier
modifierRouter.put("/update/:modifierId", authenticateToken, updateModifier);

export default modifierRouter;
