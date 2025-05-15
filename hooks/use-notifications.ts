"use client"

import { useState, useEffect } from "react"
import type { InAppNotification } from "@/types/chat"

export function useNotifications() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([])

  // Add notification
  const addNotification = (type: "success" | "warning" | "error" | "info", message: string) => {
    // Generate a unique key for this notification type + message combination
    const notificationKey = `${type}-${message}`

    // Create the new notification
    const newNotification: InAppNotification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      key: notificationKey,
    }

    setNotifications((prev) => {
      // Remove any existing notification with the same key
      const filteredNotifications = prev.filter((n) => n.key !== notificationKey)

      // Add the new notification and keep only the most recent one
      return [...filteredNotifications, newNotification].slice(-1)
    })
  }

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Auto-remove notifications after a delay
  useEffect(() => {
    if (notifications.length > 0) {
      const timeoutIds = notifications.map((notification) => {
        return setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
        }, 3000) // Remove after 3 seconds
      })

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id))
      }
    }
  }, [notifications])

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}
