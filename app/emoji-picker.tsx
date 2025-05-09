"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Smile } from "lucide-react"

// Simple emoji picker with common emojis
const COMMON_EMOJIS = ["😊", "😂", "❤️", "👍", "🔥", "😍", "🙏", "😭", "🥰", "😘", "😎", "🤔", "😢", "😁", "👋", "🎉"]

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setIsOpen(!isOpen)}>
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 bg-background border border-border rounded-md p-2 shadow-md z-10">
          <div className="grid grid-cols-4 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="text-xl hover:bg-muted p-2 rounded-md transition-colors"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
