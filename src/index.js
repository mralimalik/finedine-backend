import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDatabase from "./database.js";

import userRouter from "./router/user.routes.js";
import menuRouter from "./router/menu.routes.js";
import venueRouter from "./router/venue.routes.js";
import tableRouter from "./router/table.routes.js";
import modifierRouter from "./router/modifier.routes.js";
import orderRouter from "./router/order.routes.js";

dotenv.config();

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());


app.use("/user", userRouter);
app.use("/menu", menuRouter);
app.use("/venue", venueRouter);
app.use("/table", tableRouter);
app.use("/modifier", modifierRouter);
app.use("/order", orderRouter);






// Start server and connect to MongoDB
app.listen(port, async () => {
  await connectDatabase();
});
