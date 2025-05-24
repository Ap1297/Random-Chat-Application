"use client"

import { useState, useEffect, useCallback } from "react"

interface GiphyGif {
  id: string
  title: string
  images: {
    original: {
      url: string
    }
    fixed_width_small: {
      url: string
    }
    downsized: {
      url: string
    }
  }
}

export function useGifSearch() {
  const [showGiphySearch, setShowGiphySearch] = useState(false)
  const [giphySearchTerm, setGiphySearchTerm] = useState("")
  const [giphyResults, setGiphyResults] = useState<GiphyGif[]>([])
  const [isSearchingGiphy, setIsSearchingGiphy] = useState(false)

  // Giphy API key - this should ideally be stored in an environment variable
  const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"

  // Auto-search when search term changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (giphySearchTerm.trim()) {
        searchGiphy()
      }
    }, 500)

    return () => clearTimeout(delaySearch)
  }, [giphySearchTerm])

  const searchGiphy = async () => {
    if (!giphySearchTerm.trim()) return

    setIsSearchingGiphy(true)

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          giphySearchTerm,
        )}&limit=40&rating=g`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch GIFs")
      }

      const data = await response.json()

      // Process the results to ensure we have good quality images
      const processedResults = data.data.map((gif: any) => ({
        id: gif.id,
        title: gif.title,
        images: {
          original: {
            url: gif.images.original.url,
          },
          fixed_width_small: {
            url: gif.images.fixed_width_small.url,
          },
          downsized: {
            url: gif.images.downsized.url,
          },
        },
      }))

      setGiphyResults(processedResults)
    } catch (error) {
      console.error("Error fetching GIFs:", error)
      setGiphyResults([])
    } finally {
      setIsSearchingGiphy(false)
    }
  }

  const fetchTrendingGifs = useCallback(async () => {
    setIsSearchingGiphy(true)

    try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=40&rating=g`)

      if (!response.ok) {
        throw new Error("Failed to fetch trending GIFs")
      }

      const data = await response.json()

      // Process the results
      const processedResults = data.data.map((gif: any) => ({
        id: gif.id,
        title: gif.title,
        images: {
          original: {
            url: gif.images.original.url,
          },
          fixed_width_small: {
            url: gif.images.fixed_width_small.url,
          },
          downsized: {
            url: gif.images.downsized.url,
          },
        },
      }))

      setGiphyResults(processedResults)
    } catch (error) {
      console.error("Error fetching trending GIFs:", error)
      setGiphyResults([])
    } finally {
      setIsSearchingGiphy(false)
    }
  }, [GIPHY_API_KEY])

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
    fetchTrendingGifs,
  }
}
