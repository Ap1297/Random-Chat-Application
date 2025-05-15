"use client"

import { X } from "lucide-react"
import type { InAppNotification } from "@/types/chat"

interface NotificationListProps {
  notifications: InAppNotification[]
  onRemoveNotification: (id: string) => void
  position?: "top" | "bottom"
}

export function NotificationList({ notifications, onRemoveNotification, position = "bottom" }: NotificationListProps) {
  return (
    <div
      className={`fixed ${
        position === "bottom" ? "bottom-24" : "top-20"
      } left-0 right-0 flex flex-col items-center space-y-2 z-50 pointer-events-none`}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between px-4 py-2 rounded-full shadow-md max-w-xs animate-in fade-in slide-in-from-bottom-5 pointer-events-auto
            ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : notification.type === "error"
                  ? "bg-red-500 text-white"
                  : notification.type === "warning"
                    ? "bg-yellow-500 text-white"
                    : "bg-blue-500 text-white"
            }`}
        >
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => onRemoveNotification(notification.id)}
            className="ml-2 text-white opacity-70 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
