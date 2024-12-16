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
import { User } from "./models/user.model.js";
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
    
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

