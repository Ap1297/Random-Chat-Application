"use client"

import { useState, useEffect, useRef } from "react"
import type { ChatMessage } from "@/types/chat"

// Environment variables
const BACKEND_PROD = "wss://random-chat-application.onrender.com/chat"
const BACKEND_LOCAL = "ws://localhost:8080/chat"
const BACKEND_URL = process.env.NODE_ENV === "development" ? BACKEND_LOCAL : BACKEND_PROD

interface UseChatConnectionProps {
  onMessage: (message: ChatMessage) => void
  onConnectionChange: (isConnected: boolean) => void
  onWaitingChange: (isWaiting: boolean) => void
}

export function useChatConnection({ onMessage, onConnectionChange, onWaitingChange }: UseChatConnectionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [username, setUsername] = useState("")
  const webSocketRef = useRef<WebSocket | null>(null)
  const usernameRef = useRef<string>("")

  // Update username ref when username changes
  useEffect(() => {
    usernameRef.current = username
  }, [username])

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close()
      }
    }
  }, [])

  const connect = (usernameInput: string) => {
    if (!usernameInput.trim()) {
      console.log("Username is empty")
      return false
    }

    setIsConnecting(true)
    onWaitingChange(true)

    try {
      const ws = new WebSocket(BACKEND_URL)

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnecting(false)
        onWaitingChange(false)
        return false
      }

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setUsername(usernameInput)
        usernameRef.current = usernameInput
        onConnectionChange(true)

        // Send join message
        const joinMessage = {
          type: "JOIN",
          sender: usernameInput,
          content: `Looking for a chat partner...`,
          timestamp: new Date().toISOString(),
        }

        try {
          ws.send(JSON.stringify(joinMessage))
        } catch (error) {
          console.error("Error sending join message:", error)
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          onMessage(message)
        } catch (error) {
          console.error("Error processing received message:", error)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        onWaitingChange(false)
        onConnectionChange(false)
      }

      webSocketRef.current = ws
      return true
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      setIsConnecting(false)
      onWaitingChange(false)
      return false
    }
  }

  const disconnect = () => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      setIsConnected(false)
      setUsername("")
      onConnectionChange(false)
      return true
    }

    try {
      // Send leave message
      const leaveMessage = {
        type: "LEAVE",
        sender: usernameRef.current,
        content: `${usernameRef.current} has left the chat`,
        timestamp: new Date().toISOString(),
      }

      webSocketRef.current.send(JSON.stringify(leaveMessage))
      webSocketRef.current.close()
      setIsConnected(false)
      setUsername("")
      onConnectionChange(false)
      return true
    } catch (error) {
      console.error("Error disconnecting:", error)
      if (webSocketRef.current) {
        webSocketRef.current.close()
      }
      setIsConnected(false)
      setUsername("")
      onConnectionChange(false)
      return false
    }
  }

  const findNewPartner = () => {
    if (!isConnected || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot find new partner: WebSocket not connected")
      return false
    }

    onWaitingChange(true)

    // Send a message to find a new partner
    const findNewMessage = {
      type: "FIND_NEW",
      sender: usernameRef.current,
      content: `${usernameRef.current} is looking for a new partner`,
      timestamp: new Date().toISOString(),
    }

    try {
      webSocketRef.current.send(JSON.stringify(findNewMessage))
      return true
    } catch (error) {
      console.error("Error sending find new partner message:", error)
      return false
    }
  }

  const sendMessage = (content: string, isGif = false) => {
    if (
      (!content.trim() && !isGif) ||
      !isConnected ||
      !webSocketRef.current ||
      webSocketRef.current.readyState !== WebSocket.OPEN
    ) {
      return false
    }

    // Create a message object
    const message: ChatMessage = {
      type: "CHAT",
      sender: usernameRef.current,
      content: content,
      timestamp: new Date().toISOString(),
      isGif: isGif,
    }

    try {
      webSocketRef.current.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error("Error sending message:", error)
      return false
    }
  }

  return {
    isConnected,
    isConnecting,
    username,
    connect,
    disconnect,
    findNewPartner,
    sendMessage,
  }
}
