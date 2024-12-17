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

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({extended:true}))

// endpoints
app.use("/user", userRouter);
app.use("/menu", menuRouter);
app.use("/venue", venueRouter);
app.use("/table", tableRouter);
app.use("/modifier", modifierRouter);
app.use("/order", orderRouter);
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

connectDatabase()
  .then(() => {
    app.listen(port, async () => {
      console.log("server is now running");
    });
  })
  .catch((e) => {
    console.log(e);
  });
