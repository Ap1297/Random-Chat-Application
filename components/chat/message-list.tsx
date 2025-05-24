"use client"

import { useRef, useEffect } from "react"
import type { ChatMessage } from "@/types/chat"

interface MessageListProps {
  messages: ChatMessage[]
  username: string
  systemMessage: string | null
  isKeyboardVisible: boolean
}

export function MessageList({ messages, username, systemMessage, isKeyboardVisible }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // iOS-specific fix for scrolling issues when keyboard appears
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    // Check if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

    if (isIOS && messageListRef.current) {
      // When keyboard visibility changes on iOS
      if (isKeyboardVisible) {
        // Add a small delay to ensure layout has adjusted
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" })
          }
        }, 300)
      }
    }
  }, [isKeyboardVisible])

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* System message banner */}
      {systemMessage && (
        <div className="sticky top-0 bg-muted text-muted-foreground text-center py-2 z-10">
          <p className="italic">{systemMessage}</p>
        </div>
      )}

      {/* Message list - using a simple div with overflow-auto */}
      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto p-4 pb-6"
        style={{
          overscrollBehavior: "contain", // Prevents scroll chaining
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          // iOS-specific styles
          position: "relative", // Helps with iOS scrolling
          zIndex: 1, // Ensures content is above other elements
        }}
      >
        <div className="space-y-4">
          {messages
            .filter((msg) => msg.type === "CHAT") // Only show chat messages, not system messages
            .map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === username ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === username
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.sender !== username && <div className="font-semibold text-xs mb-1">{msg.sender}</div>}
                  {msg.isGif ? (
                    <div className="max-w-full overflow-hidden rounded">
                      <img
                        src={msg.content || "/placeholder.svg"}
                        alt="GIF"
                        className="max-w-full h-auto max-h-32 object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} id="messages-end" />
        </div>
      </div>
    </div>
  )
}
