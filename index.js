import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDatabase from "./src/database.js";

import userRouter from "./src/router/user.routes.js";
import menuRouter from "./src/router/menu.routes.js";
import venueRouter from "./src/router/venue.routes.js";
import tableRouter from "./src/router/table.routes.js";
import modifierRouter from "./src/router/modifier.routes.js";
import orderRouter from "./src/router/order.routes.js";
import { User } from "./src/models/user.model.js";
dotenv.config();

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

// Test API to Get All Users
app.get("/test", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    console.log(users);

    res.status(200).json(users);
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// endpoints
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
