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

  // Auto-scroll to bottom when new messages arrive - improved for mobile
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling on mobile
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          })
        }
      })
    }
  }, [messages])

  // iOS-specific fix for scrolling issues when keyboard appears
  useEffect(() => {
    if (typeof window === "undefined") return

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (isMobile && messageListRef.current) {
      if (isKeyboardVisible) {
        // When keyboard appears, just scroll the message list
        setTimeout(() => {
          if (messagesEndRef.current && messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight
          }
        }, 100)
      } else {
        // When keyboard hides, ensure we're still at the bottom
        setTimeout(() => {
          if (messagesEndRef.current && messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight
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
        data-message-list
        className="flex-1 overflow-y-auto p-4 pb-6"
        style={{
          overscrollBehavior: "contain", // Prevents scroll chaining
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          // Mobile-specific styles to prevent header displacement
          position: "relative",
          zIndex: 1,
          // Prevent elastic scrolling on iOS that can cause header issues
          overscrollBehaviorY: "contain",
          // Ensure consistent scrolling behavior
          scrollBehavior: "auto",
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
