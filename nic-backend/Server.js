const express = require("express");
const cors = require("cors");
require("dotenv").config();

const AuthRoutes = require("./Routers/Auth");
const DashboardRoutes = require(
  "./Routers/Dashboard"
);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/auth", AuthRoutes);
app.use("/dashboard", DashboardRoutes);

app.get("/", (req, res) => {
  res.send("NIC Validation Backend is Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});