import { Router } from "express";

import authenticateToken from '../middleware/auth_token.js'
import { getVenueReport } from "../controllers/report.controller.js";
const reportRouter = Router();

reportRouter.route('/:venueId').get(getVenueReport)


export default reportRouter;