"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, ImageIcon, Send, Plus } from "lucide-react"
import { useGifSearch } from "@/hooks/use-gif-search"

interface MessageInputProps {
  onSendMessage: (content: string, isGif?: boolean) => void
  isConnected: boolean
  isWaitingForPartner: boolean
}

export function MessageInput({ onSendMessage, isConnected, isWaitingForPartner }: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
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
    fetchTrendingGifs,
  } = useGifSearch()

  // Fetch trending GIFs when GIF picker is opened
  useEffect(() => {
    if (showGiphySearch && giphyResults.length === 0 && !giphySearchTerm) {
      fetchTrendingGifs()
    }
  }, [showGiphySearch, giphyResults.length, giphySearchTerm, fetchTrendingGifs])

  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected && !isWaitingForPartner) {
      onSendMessage(messageInput)
      setMessageInput("")

      // Mobile-specific: prevent viewport jumping and keep input above keyboard
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobile) {
        // Prevent any scrolling or viewport changes
        const currentScrollY = window.scrollY
        const currentScrollX = window.scrollX

        // Keep the input focused immediately to maintain keyboard position
        if (inputRef.current) {
          inputRef.current.focus()

          // Prevent the page from scrolling after focus
          setTimeout(() => {
            window.scrollTo(currentScrollX, currentScrollY)

            // Ensure input stays focused and keyboard stays open
            if (inputRef.current) {
              inputRef.current.focus()
            }
          }, 0)

          // Additional check to maintain position
          setTimeout(() => {
            window.scrollTo(currentScrollX, currentScrollY)
          }, 50)
        }
      } else {
        // Focus the input after sending on desktop
        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendGif = (gifUrl: string) => {
    onSendMessage(gifUrl, true)
    resetGiphySearch()
  }

  // Close GIF picker
  const handleCloseGifPicker = () => {
    setShowGiphySearch(false)
    resetGiphySearch()
  }

  // Toggle between emoji and GIF picker
  const handleToggleEmojiInGifWindow = () => {
    setShowGiphySearch(false)
    setShowEmojiPicker(true)
  }

  // Simple emoji picker
  const emojis = ["😊", "😂", "❤️", "👍", "🔥", "😍", "🙏", "😭", "🥰", "😘", "🎉", "💯", "🤔", "😎", "🙌"]

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
    // Focus the input after selecting an emoji
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <div className="bg-[#0c0c0c] border-t border-[#2a2a2a]">
      {/* Emoji Picker - Full Screen */}
      {showEmojiPicker && (
        <div className="bg-[#0c0c0c] h-[400px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <h3 className="text-white text-lg font-medium">Emojis</h3>
          </div>

          {/* Emoji grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-8 gap-3">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  className="text-2xl hover:bg-[#2a2a2a] p-2 rounded-md transition-colors"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center justify-center px-4 py-3 border-t border-[#2a2a2a]">
            <div className="flex space-x-8">
              <button className="text-white">
                <Smile className="h-6 w-6" />
              </button>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setShowEmojiPicker(false)
                  setShowGiphySearch(true)
                }}
              >
                <span className="font-medium text-lg">GIF</span>
              </button>
              <button className="text-gray-400 hover:text-white" onClick={() => setShowEmojiPicker(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L13.09 8.26L19 7L14.74 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12L5 7L10.91 8.26L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIF Search - Full Screen */}
      {showGiphySearch && (
        <div className="bg-[#0c0c0c] h-[400px] flex flex-col">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <div className="relative">
              <Input
                placeholder="Search GIFs via GIPHY"
                value={giphySearchTerm}
                onChange={(e) => setGiphySearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchGiphy()}
                className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-400 h-10 rounded-lg"
              />
              <div className="absolute left-3 top-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* GIF grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {isSearchingGiphy ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-pulse text-sm text-gray-400">Searching...</div>
              </div>
            ) : giphyResults.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {giphyResults.map((gif) => (
                  <div
                    key={gif.id}
                    className="overflow-hidden cursor-pointer rounded-lg"
                    onClick={() => handleSendGif(gif.images.downsized.url)}
                  >
                    <img
                      src={gif.images.fixed_width_small.url || "/placeholder.svg"}
                      alt={gif.title}
                      className="w-full h-auto hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="text-sm text-gray-400">{giphySearchTerm ? "No results found" : "Loading GIFs..."}</div>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center justify-center px-4 py-3 border-t border-[#2a2a2a]">
            <div className="flex space-x-8">
              <button className="text-gray-400 hover:text-white" onClick={handleToggleEmojiInGifWindow}>
                <Smile className="h-6 w-6" />
              </button>
              <button className="text-white">
                <span className="font-medium text-lg">GIF</span>
              </button>
              <button className="text-gray-400 hover:text-white" onClick={handleCloseGifPicker}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-3 flex space-x-3">
        <div className="flex-1 flex space-x-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 text-gray-400 hover:text-white">
            <Plus className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-gray-400 hover:text-white"
            onClick={() => setShowEmojiPicker(true)}
          >
            <Smile className="h-5 w-5" />
          </Button>

          <Input
            ref={inputRef}
            placeholder={isWaitingForPartner ? "Waiting for a partner..." : "Type a message"}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isConnected || isWaitingForPartner}
            className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-400 rounded-full h-10"
            style={{
              // Prevent iOS zoom and viewport changes
              fontSize: "16px",
              // Prevent input from causing layout shifts
              transform: "translateZ(0)",
            }}
            onFocus={(e) => {
              // Prevent scroll on focus for mobile
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent,
              )
              if (isMobile) {
                e.preventDefault()
                e.target.focus()
              }
            }}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-gray-400 hover:text-white"
            onClick={() => setShowGiphySearch(true)}
            disabled={!isConnected || isWaitingForPartner}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSendMessage}
          disabled={!isConnected || isWaitingForPartner || !messageInput.trim()}
          className="h-10 w-10 flex-shrink-0 text-gray-400 hover:text-white"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
