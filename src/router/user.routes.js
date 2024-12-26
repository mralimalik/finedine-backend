import { Router } from "express";
import {signInUser,getUserData,updateUser} from "../controllers/user.controller.js";
import authenticateToken from '../middleware/auth_token.js'
import { upload } from "../middleware/image_upload.js";
const userRouter = Router();

userRouter.route('/signin').post(signInUser);
userRouter.route('/').get(authenticateToken,getUserData)
userRouter.route('/update').put(authenticateToken,upload.single("businessLogo"),updateUser)


export default userRouter;