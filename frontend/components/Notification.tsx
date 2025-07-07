"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { Bell, X, User } from "lucide-react"

interface Notification {
    id: string;
    userId: string;
    commentId: string;
    isRead: boolean;
    createdAt: Date;
    comment: Comment
}

interface Comment {
    id: string;
    content: string;
    user: User;
}

interface User {
    id: string;
    name?: string;
    email: string;
}

export default function NotificationComponent() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Simulate fetching notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true)
            // Simulate API delay
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })
                console.log("Fetched notifications:", res.data.notifications)
                setNotifications(res.data.notifications)
            } catch (error) {
                console.error("Error fetching notifications:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchNotifications()
    }, [])

    const unreadCount = notifications.filter((n) => !n.isRead).length

    const toggleReadStatus = async (id: string) => {
        try {
            // Simulate API call to toggle read status
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/mark-as-read`, {}, {
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === id ? { ...notification, isRead: !notification.isRead } : notification,
                ),
            )
        } catch (error) {
            console.error("Error toggling read status:", error)
        }
    }

    return (
        <>
            {/* Notification Bell - Fixed Position */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-gray-200"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                        <>
                            <Bell className="w-6 h-6 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </>
                    )}
                </button>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-neutral-200/40 backdrop-blur-sm flex items-start justify-end p-4">
                    <div className="bg-white overflow-hidden rounded-lg shadow-2xl w-full max-w-sm mt-20 max-h-[70vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
                                {unreadCount > 0 && (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{unreadCount} new</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-3 transition-colors ${!notification.isRead ? "bg-blue-50/40 border-l-2 border-l-blue-400" : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-900 leading-relaxed">
                                                        <span className="font-semibold">{notification.comment.user.email}</span>{" "}
                                                        <span className="text-gray-600">{notification.comment.content}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toDateString()}</p>
                                                </div>

                                                {/* Read/Unread Toggle */}
                                                <div className="flex-shrink-0">
                                                    <button
                                                        onClick={() => {
                                                            // backend API call to mark as read
                                                            toggleReadStatus(notification.id)
                                                        }}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notification.isRead ? "bg-gray-300" : "bg-blue-500"
                                                            }`}
                                                        title={notification.isRead ? "Mark as unread" : "Mark as read"}
                                                    >
                                                        <span
                                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${notification.isRead ? "translate-x-1" : "translate-x-5"
                                                                }`}
                                                        />
                                                    </button>
                                                    <div className="text-center mt-1">
                                                        <span
                                                            className={`text-xs font-medium ${notification.isRead ? "text-gray-500" : "text-blue-600"
                                                                }`}
                                                        >
                                                            {notification.isRead ? "Read" : "New"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-100 bg-gray-50">
                                <button className="w-full text-center text-xs text-gray-600 hover:text-gray-800 font-medium py-1">
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
