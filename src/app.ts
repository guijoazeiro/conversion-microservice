import express from "express";
import morgan from "morgan";
import { VERSION } from "./config/enviroment";
import { formatUptime } from "./utils/formatUptime";

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    version: VERSION,
  });
});

export default app;
