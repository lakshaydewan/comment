import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getNotifications, markNotificationAsRead } from "../controllers/notification.controller";

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/mark-as-read', authenticate, markNotificationAsRead);

export default router;