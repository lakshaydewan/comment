import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import commentRoutes from "./routes/comment.routes";
import notificationRoutes from "./routes/notification.route";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);
app.use('/api/notifications', notificationRoutes);

export default app;
