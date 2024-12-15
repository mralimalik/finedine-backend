import { Router } from "express";
import {signInUser,getUserData} from "../controllers/user.controller.js";
import authenticateToken from '../middleware/auth_token.js'

const userRouter = Router();

userRouter.route('/signin').post(signInUser);
userRouter.route('/').get(authenticateToken,getUserData)

export default userRouter;