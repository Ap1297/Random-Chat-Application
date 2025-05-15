"use client"

import { useState, useEffect } from "react"

// Define types for visualViewport API
declare global {
  interface Window {
    originalWindowHeight?: number
  }
}

/**
 * Hook to detect keyboard visibility on mobile devices
 * Uses visualViewport API when available, falls back to window resize events
 */
export function useKeyboardVisibility(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    // Store original window height on first load
    if (!window.originalWindowHeight) {
      window.originalWindowHeight = window.innerHeight
    }

    // Function to detect keyboard using visualViewport API if available
    const detectKeyboardWithVisualViewport = () => {
      if (!window.visualViewport) return

      // On mobile, when keyboard appears, the visual viewport height decreases
      const viewportHeight = window.visualViewport.height
      const windowHeight = window.innerHeight

      // If visual viewport is significantly smaller than window, keyboard is likely visible
      setIsKeyboardVisible(windowHeight - viewportHeight > 150)
    }

    // Fallback function to detect keyboard using window resize
    const detectKeyboardWithResize = () => {
      if (!window.originalWindowHeight) return

      const heightReduction = window.originalWindowHeight - window.innerHeight
      setIsKeyboardVisible(heightReduction > 150)
    }

    // Use the appropriate detection method based on browser support
    const detectKeyboard = window.visualViewport ? detectKeyboardWithVisualViewport : detectKeyboardWithResize

    // Set up event listeners based on available APIs
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", detectKeyboard)
    } else {
      window.addEventListener("resize", detectKeyboard)
    }

    // Initial check
    detectKeyboard()

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", detectKeyboard)
      } else {
        window.removeEventListener("resize", detectKeyboard)
      }
    }
  }, [])

  return isKeyboardVisible
}
