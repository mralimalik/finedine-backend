import { Router } from "express";
import authenticateToken from "../middleware/auth_token.js";
import { adminLogin, getAllUsersWithVenues, createUser, getAdminData, updateUserBusinessImage, updateSettings, getSettings } from "../controllers/admin.controller.js";
import { upload } from "../middleware/image_upload.js";

const adminRouter = Router();

adminRouter.route("/signin").post(adminLogin);
// get admin data
adminRouter.route("/").get(authenticateToken, getAdminData);

// create new user for finedine
adminRouter.route("/create/user").post(authenticateToken, upload.single('businessLogo'), createUser);
// get all users with their venues
adminRouter.route("/users").get(authenticateToken, getAllUsersWithVenues);

// update business image
adminRouter.route("/update/user/:userId/businessImage").post(authenticateToken, upload.single('businessLogo'), updateUserBusinessImage);

// update site settings
adminRouter.route("/settings").put(authenticateToken, updateSettings);

// get site settings
adminRouter.route("/settings").get(authenticateToken, getSettings);

export default adminRouter;
