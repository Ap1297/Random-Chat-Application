"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void
}

export function GifPicker({ onGifSelect }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65" // Replace with your Giphy API key

  const searchGifs = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          searchTerm,
        )}&limit=8&rating=g`,
      )
      const data = await response.json()
      setResults(data.data)
    } catch (error) {
      console.error("Error searching Giphy:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleGifClick = (gifUrl: string) => {
    onGifSelect(gifUrl)
    setIsOpen(false)
    setResults([])
    setSearchTerm("")
  }

  return (
    <div className="relative">
      <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setIsOpen(!isOpen)}>
        <ImageIcon className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 bg-background border border-border rounded-md p-2 shadow-md z-10 w-64">
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchGifs()}
                className="text-sm"
              />
              <Button size="sm" onClick={searchGifs} disabled={isSearching || !searchTerm.trim()}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                {results.map((gif) => (
                  <img
                    key={gif.id}
                    src={gif.images.fixed_height_small.url || "/placeholder.svg"}
                    alt={gif.title}
                    className="rounded cursor-pointer h-20 object-cover w-full"
                    onClick={() => handleGifClick(gif.images.original.url)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
