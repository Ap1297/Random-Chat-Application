"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, ImageIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MessageInputProps {
  onSendMessage: (content: string, isGif?: boolean) => void
  isConnected: boolean
  isWaitingForPartner: boolean
}

export function MessageInput({ onSendMessage, isConnected, isWaitingForPartner }: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected && !isWaitingForPartner) {
      onSendMessage(messageInput)
      setMessageInput("")

      // Focus the input after sending
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Simple emoji picker
  const emojis = ["😊", "😂", "❤️", "👍", "🔥", "😍", "🙏", "😭", "🥰", "😘"]

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji)
    // Focus the input after selecting an emoji
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <div className="p-4 bg-card border-t border-border">
      <div className="flex space-x-2">
        <div className="flex-1 flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-5 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="text-xl hover:bg-muted p-2 rounded-md transition-colors"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => alert("GIF feature coming soon!")}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Input
            ref={inputRef}
            placeholder={isWaitingForPartner ? "Waiting for a partner..." : "Type a message..."}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isConnected || isWaitingForPartner}
            className="flex-1"
          />
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={!isConnected || isWaitingForPartner || !messageInput.trim()}
          className="flex-shrink-0"
        >
          Send
        </Button>
      </div>
    </div>
  )
}
