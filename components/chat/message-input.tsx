"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, ImageIcon, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { useGifSearch } from "@/hooks/use-gif-search"

interface MessageInputProps {
  onSendMessage: (content: string, isGif?: boolean) => void
  isConnected: boolean
  isWaitingForPartner: boolean
}

export function MessageInput({ onSendMessage, isConnected, isWaitingForPartner }: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    showGiphySearch,
    setShowGiphySearch,
    giphySearchTerm,
    setGiphySearchTerm,
    giphyResults,
    isSearchingGiphy,
    searchGiphy,
    resetGiphySearch,
  } = useGifSearch()

  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected && !isWaitingForPartner) {
      onSendMessage(messageInput)
      setMessageInput("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput((prev) => prev + emoji.native)
  }

  const handleSendGif = (gifUrl: string) => {
    onSendMessage(gifUrl, true)
    resetGiphySearch()
  }

  return (
    <>
      {showGiphySearch && (
        <div className="p-4 bg-card border-t border-border fixed bottom-20 left-0 right-0 z-20">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search for GIFs..."
                value={giphySearchTerm}
                onChange={(e) => setGiphySearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchGiphy()}
              />
              <Button onClick={searchGiphy} disabled={isSearchingGiphy || !giphySearchTerm.trim()}>
                {isSearchingGiphy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            {giphyResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {giphyResults.map((gif) => (
                  <img
                    key={gif.id}
                    src={gif.images.fixed_height_small.url || "/placeholder.svg"}
                    alt={gif.title}
                    className="rounded cursor-pointer h-20 object-cover w-full"
                    onClick={() => handleSendGif(gif.images.original.url)}
                  />
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowGiphySearch(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 bg-card border-t border-border fixed bottom-0 left-0 right-0 z-10">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setShowGiphySearch(!showGiphySearch)}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              <Input
                ref={inputRef}
                placeholder={isWaitingForPartner ? "Waiting for a partner..." : "Type a message..."}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  // When input is focused, scroll to bottom with a delay
                  // but don't use smooth scrolling which can cause issues
                  setTimeout(() => {
                    const messagesEnd = document.getElementById("messages-end")
                    if (messagesEnd) {
                      // Use direct DOM scrolling to avoid animation issues
                      const scrollContainer = document.querySelector("[data-radix-scroll-area-viewport]")
                      if (scrollContainer) {
                        const scrollHeight = scrollContainer.scrollHeight
                        scrollContainer.scrollTop = scrollHeight
                      } else {
                        // Fallback to scrollIntoView
                        messagesEnd.scrollIntoView({ behavior: "auto", block: "end" })
                      }
                    }
                  }, 100)
                }}
                disabled={!isConnected || isWaitingForPartner}
                className="flex-1"
              />
            </div>
            <Button onClick={handleSendMessage} disabled={!isConnected || isWaitingForPartner || !messageInput.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
