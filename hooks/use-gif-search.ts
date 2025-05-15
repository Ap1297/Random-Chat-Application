"use client"

import { useState } from "react"

const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"

export function useGifSearch() {
  const [showGiphySearch, setShowGiphySearch] = useState(false)
  const [giphySearchTerm, setGiphySearchTerm] = useState("")
  const [giphyResults, setGiphyResults] = useState<any[]>([])
  const [isSearchingGiphy, setIsSearchingGiphy] = useState(false)

  const searchGiphy = async () => {
    if (!giphySearchTerm.trim()) return

    setIsSearchingGiphy(true)
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          giphySearchTerm,
        )}&limit=8&rating=g`,
      )
      const data = await response.json()
      setGiphyResults(data.data)
    } catch (error) {
      console.error("Error searching Giphy:", error)
    } finally {
      setIsSearchingGiphy(false)
    }
  }

  const resetGiphySearch = () => {
    setShowGiphySearch(false)
    setGiphySearchTerm("")
    setGiphyResults([])
  }

  return {
    showGiphySearch,
    setShowGiphySearch,
    giphySearchTerm,
    setGiphySearchTerm,
    giphyResults,
    isSearchingGiphy,
    searchGiphy,
    resetGiphySearch,
  }
}
