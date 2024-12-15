import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";
import {
  getAllMenues,
  updateMenu,
  getMenuItemsWithSections,
  createMenuWitoutItems,
  createMenuWithItemsSections,
  getMenuData,
  getMenuItemsWithSectionsForQr,
  addMenuSection,
  addMenuItem,
  updateMenuSection
} from "../controllers/menu.controller.js";
import { upload } from "../middleware/image_upload.js";

const menuRouter = Router();

// to get all menus, menu items, menu sections
menuRouter.get("/menuitems/:menuId", authenticateToken, getMenuItemsWithSections);
menuRouter.get("/:venueId", authenticateToken, getAllMenues);

// to update menu 
menuRouter.patch("/:menuId", authenticateToken, updateMenu);

// to add menu without items or with items sections data
menuRouter.post("/emptyMenu/:venueId", authenticateToken, createMenuWitoutItems);
menuRouter.post("/sampleMenu/:venueId", authenticateToken, createMenuWithItemsSections);

// to add menu section in specific menu  or update menu item or menu sections
menuRouter.post("/menusection/:menuId", authenticateToken,upload.single('itemImage'), addMenuSection);
menuRouter.post("/menuitem/:menuId", authenticateToken,upload.single('itemImage'),addMenuItem);

menuRouter.put("/menusection/:sectionId", authenticateToken,upload.single('itemImage'),updateMenuSection);




// to get the menu data on qr site
menuRouter.get("/qr/:venueId/:menuId", getMenuData);
menuRouter.get("/qr/:menuId", getMenuItemsWithSectionsForQr);


export default menuRouter;
