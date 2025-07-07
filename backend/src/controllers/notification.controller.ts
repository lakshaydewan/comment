import { Request, Response } from "express";
import prisma from "../config/prisma";

prisma.comment.create({
    data: {
        content: "Replied to your comment on 'React Best Practices'",
        userId: "user1",
        parentId: null,
        editableUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        isDeleted: false,
        createdAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        updatedAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    }
})

export const getNotifications = async (req: Request, res: Response) => {

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user?.id },
            include: {
                comment: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        console.log("Marking notification as read:", id)
        const notification = await prisma.notification.findUnique({
            where: { id },
        });
        console.log("Notification found:", notification)

        if (!notification || notification.userId !== req.user?.id) {
            res.status(404).json({ error: "Notification not found" });
            return
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { isRead: (notification.isRead ? false : true) },
        });

        console.log("Notification status changed:", updatedNotification)

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to mark as read" });
    }
}