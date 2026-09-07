import express from "express";
import routes from "./routes";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { errorHandler } from "./middleware/error.middleware";
import cors from "cors";
import config from "./config";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
  })
);

app.use(
  express.json({
    limit: "32kb",
  })
);
app.use("/api/v1", routes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
