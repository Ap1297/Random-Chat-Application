"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage } from "@/types/chat"

interface MessageListProps {
  messages: ChatMessage[]
  username: string
  systemMessage: string | null
  isKeyboardVisible: boolean
}

export function MessageList({ messages, username, systemMessage, isKeyboardVisible }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <>
      {/* System message banner */}
      {systemMessage && (
        <div className="fixed top-16 left-0 right-0 bg-muted text-muted-foreground text-center py-2 z-10">
          <p className="italic">{systemMessage}</p>
        </div>
      )}

      <ScrollArea
        className={`flex-1 p-4 ${systemMessage ? "mt-24" : "mt-16"} ${isKeyboardVisible ? "mb-24" : "mb-20"}`}
        ref={scrollAreaRef}
      >
        <div className="space-y-4">
          {messages
            .filter((msg) => msg.type === "CHAT") // Only show chat messages, not system messages
            .map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === username ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === username
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.sender !== username && <div className="font-semibold text-xs mb-1">{msg.sender}</div>}
                  {msg.isGif ? (
                    <img src={msg.content || "/placeholder.svg"} alt="GIF" className="rounded-md max-w-full h-auto" />
                  ) : (
                    <div>{msg.content}</div>
                  )}
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </>
  )
}
