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
import reportRouter from "./src/router/report.routes.js";
import adminRouter from "./src/router/admin.routes.js";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors({ origin: "*" }));
// app.use(cors()); // This allows all origins by default

// app.use(cors({
//   origin: ["https://finedine-dashboard.vercel.app","https://qr-menu-frontend-beryl.vercel.app","https://finedine-admin.vercel.app"], // Allow specific origin
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"], // Allowed methods
//   credentials: true // If your request includes credentials
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// user endpoints
app.use("/user", userRouter);
app.use("/menu", menuRouter);
app.use("/venue", venueRouter);
app.use("/table", tableRouter);
app.use("/modifier", modifierRouter);
app.use("/order", orderRouter);
app.use("/report", reportRouter);
// admin endpoint
app.use("/admin", adminRouter);

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
