"use client"

import { useState, useRef, useEffect } from "react"

export function useSystemMessage() {
  const [systemMessage, setSystemMessage] = useState<string | null>(null)
  const systemMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update system message with auto-removal
  const updateSystemMessage = (message: string) => {
    console.log("Setting system message:", message)

    // Clear any existing timeout for system message
    if (systemMessageTimeoutRef.current) {
      clearTimeout(systemMessageTimeoutRef.current)
    }

    setSystemMessage(message)
  }

  // Handle system message auto-removal
  useEffect(() => {
    if (systemMessage) {
      // For connection messages, keep them visible longer
      const isConnectionMessage = systemMessage.includes("You are now chatting with")
      const timeout = isConnectionMessage ? 15000 : 8000

      systemMessageTimeoutRef.current = setTimeout(() => {
        console.log("Auto-removing system message:", systemMessage)
        setSystemMessage(null)
      }, timeout)

      return () => {
        if (systemMessageTimeoutRef.current) {
          clearTimeout(systemMessageTimeoutRef.current)
        }
      }
    }
  }, [systemMessage])

  return {
    systemMessage,
    updateSystemMessage,
  }
}
