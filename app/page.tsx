"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserRound, RefreshCw, Smile, ImageIcon, MessageSquare, X, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ChatMessage {
  id?: string
  type:
    | "CHAT"
    | "JOIN"
    | "LEAVE"
    | "USERS"
    | "PARTNER_CONNECTED"
    | "PARTNER_DISCONNECTED"
    | "WAITING"
    | "FIND_NEW"
    | "SYSTEM"
  sender: string
  content: string
  timestamp: string
  users?: string[]
  isGif?: boolean
  // Local flag to track messages added by the client
  isLocal?: boolean
}

interface InAppNotification {
  id: string
  type: "success" | "warning" | "error" | "info"
  message: string
  timestamp: number
  key?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false)
  const [showGiphySearch, setShowGiphySearch] = useState(false)
  const [giphySearchTerm, setGiphySearchTerm] = useState("")
  const [giphyResults, setGiphyResults] = useState<any[]>([])
  const [isSearchingGiphy, setIsSearchingGiphy] = useState(false)
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([])
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  // NEW: Single system message state
  const [systemMessage, setSystemMessage] = useState<string | null>(null)
  // NEW: Debug mode
  const webSocketRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Store the username in a ref to avoid closure issues
  const usernameRef = useRef<string>("")
  // Update the constants to make it easier to switch between environments
  const BACKEND_PROD = "wss://random-chat-application.onrender.com/chat"
  const BACKEND_LOCAL = "ws://localhost:8080/chat"
  // Use local backend for development, production for deployment
  const BACKEND_URL = process.env.NODE_ENV === "development" ? BACKEND_LOCAL : BACKEND_PROD
  const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65" // Replace with your Giphy API key
  const systemMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update username ref when username changes
  useEffect(() => {
    usernameRef.current = username
  }, [username])

  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle keyboard visibility on mobile
  useEffect(() => {
    // Function to detect keyboard visibility
    const detectKeyboard = () => {
      // On mobile, when keyboard appears, the viewport height decreases
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75
      setIsKeyboardVisible(isKeyboard)

      // If keyboard is visible, scroll to the input field
      if (isKeyboard && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus()
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }

    // Listen for resize events which happen when keyboard appears/disappears
    window.addEventListener("resize", detectKeyboard)

    // Initial check
    detectKeyboard()

    return () => {
      window.removeEventListener("resize", detectKeyboard)
    }
  }, [])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Add in-app notification
  const addInAppNotification = (type: "success" | "warning" | "error" | "info", message: string) => {
    // Generate a unique key for this notification type + message combination
    const notificationKey = `${type}-${message}`

    // Create the new notification
    const newNotification: InAppNotification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      // Add a key property to help with deduplication
      key: notificationKey,
    }

    setInAppNotifications((prev) => {
      // Remove any existing notification with the same key
      const filteredNotifications = prev.filter((n) => n.key !== notificationKey)

      // Add the new notification and keep only the most recent one
      return [...filteredNotifications, newNotification].slice(-1)
    })
  }

  // Handle in-app notifications auto-removal
  useEffect(() => {
    if (inAppNotifications.length > 0) {
      const timeoutIds = inAppNotifications.map((notification) => {
        return setTimeout(() => {
          setInAppNotifications((prev) => prev.filter((n) => n.id !== notification.id))
        }, 3000) // Remove after 3 seconds
      })

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id))
      }
    }
  }, [inAppNotifications])

  // NEW: Update system message with auto-removal
  const updateSystemMessage = (message: string) => {
    console.log("Setting system message:", message)

    // Clear any existing timeout for system message
    if (systemMessageTimeoutRef.current) {
      clearTimeout(systemMessageTimeoutRef.current)
    }

    setSystemMessage(message)
  }

  const connectToChat = () => {
    if (!usernameInput.trim()) {
      console.log("Username is empty")
      addInAppNotification("error", "Username required")
      return
    }

    // Add this console log before creating the WebSocket
    setIsConnecting(true)
    setIsWaitingForPartner(true)

    try {
      // Use the appropriate backend URL
      const ws = new WebSocket(BACKEND_URL)

      // Add error handling for WebSocket creation
      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnecting(false)
        setIsWaitingForPartner(false)
        addInAppNotification("error", "Failed to connect to chat server")
      }

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)

        // Set username state and ref
        setUsername(usernameInput)
        usernameRef.current = usernameInput

        addInAppNotification("success", "Connected! Looking for a chat partner...")

        // Send join message
        const joinMessage = {
          type: "JOIN",
          sender: usernameInput,
          content: `Looking for a chat partner...`,
          timestamp: new Date().toISOString(),
        }

        try {
          ws.send(JSON.stringify(joinMessage))
        } catch (error) {
          console.error("Error sending join message:", error)
        }

        // Update system message
        updateSystemMessage("Waiting for a chat partner...")
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === "USERS") {
            // For 1-on-1 chat, we'll use this to determine if we have a partner
            if (message.users && message.users.length === 2) {
              // Use the current username from the ref to ensure we have the latest value
              const currentUsername = usernameRef.current
              const partner = message.users.find((user: string) => user !== currentUsername)

              if (partner && !partnerName) {
                // Only update if we don't already have a partner
                setPartnerName(partner)
                setIsWaitingForPartner(false)
                addInAppNotification("success", `Now chatting with ${partner}`)
                updateSystemMessage(`You are now chatting with ${partner}`)
              }
            }
          } else if (message.type === "PARTNER_CONNECTED") {
            // Direct notification that a partner has connected
            // Extract the partner username from the message content
            const partnerUsername = message.content.replace("You are now chatting with ", "")

            // Use the current username from the ref to ensure we have the latest value
            const currentUsername = usernameRef.current

            console.log("PARTNER_CONNECTED message received:", message)
            console.log("Current username (ref):", currentUsername)
            console.log("Extracted partner username:", partnerUsername)

            // Make sure we don't set ourselves as the partner
            if (partnerUsername !== currentUsername) {
              setPartnerName(partnerUsername)
              setIsWaitingForPartner(false)
              addInAppNotification("success", `Now chatting with ${partnerUsername}`)

              // Update system message and ensure it's visible
              updateSystemMessage(`You are now chatting with ${partnerUsername}`)

              // Force system message to stay visible longer for connection notifications
              const timeoutId = setTimeout(() => {
                setSystemMessage(null)
              }, 15000) // Keep visible for 15 seconds

              console.log("Partner connected notification processed successfully")
            }
          } else if (message.type === "PARTNER_DISCONNECTED") {
            // Partner disconnected
            setPartnerName(null)
            setIsWaitingForPartner(true)
            addInAppNotification("warning", "Partner disconnected. Looking for a new partner...")
            updateSystemMessage("Looking for a new chat partner...")
          } else if (message.type === "CHAT") {
            // Only add messages from the partner, not our own messages
            // Our own messages are added locally when we send them
            const currentUsername = usernameRef.current
            if (message.sender !== currentUsername) {
              // Add the message to the chat history
              setMessages((prev) => [...prev, message])

              // Auto-scroll to bottom when new message arrives
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
                }
              }, 100)
            }
          } else if (message.type === "SYSTEM") {
            // System messages - update the system message state
            updateSystemMessage(message.content)
          }
        } catch (error) {
          console.error("Error processing received message:", error)
        }
      }

      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event)
        setIsConnected(false)
        setIsConnecting(false)
        setIsWaitingForPartner(false)
        addInAppNotification("error", "Disconnected from chat server")
        setSystemMessage(null)
      }

      webSocketRef.current = ws
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      setIsConnecting(false)
      setIsWaitingForPartner(false)
      addInAppNotification("error", "Failed to create connection")
    }
  }

  const findNewPartner = () => {
    if (!isConnected || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot find new partner: WebSocket not connected")
      addInAppNotification("error", "Not connected to chat server")
      return
    }

    setPartnerName(null)
    setIsWaitingForPartner(true)

    // Update system message
    updateSystemMessage("Looking for a new chat partner...")

    // Send a message to find a new partner
    const findNewMessage = {
      type: "FIND_NEW",
      sender: usernameRef.current,
      content: `${usernameRef.current} is looking for a new partner`,
      timestamp: new Date().toISOString(),
    }

    try {
      webSocketRef.current.send(JSON.stringify(findNewMessage))
      addInAppNotification("info", "Finding a new partner...")
    } catch (error) {
      console.error("Error sending find new partner message:", error)
      addInAppNotification("error", "Failed to find a new partner")
    }
  }

  const clearChat = () => {
    // Clear all messages
    setMessages([])
    addInAppNotification("info", "Chat cleared")
  }

  const sendMessage = (content = messageInput, isGif = false) => {
    if ((!content.trim() && !isGif) || !isConnected || isWaitingForPartner) {
      return
    }

    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: WebSocket not connected")
      addInAppNotification("error", "Not connected to chat server")
      return
    }

    // Use the current username from the ref to ensure we have the latest value
    const currentUsername = usernameRef.current

    // Create a message object with the current username from ref
    const message: ChatMessage = {
      type: "CHAT",
      sender: currentUsername,
      content: content,
      timestamp: new Date().toISOString(),
      isGif: isGif,
      isLocal: true, // Mark as local message
    }

    try {
      webSocketRef.current.send(
        JSON.stringify({
          type: message.type,
          sender: message.sender,
          content: message.content,
          timestamp: message.timestamp,
          isGif: message.isGif,
        }),
      )

      // Add the message locally to ensure it appears immediately
      setMessages((prev) => [...prev, message])

      // Only clear input and hide GIF search if the message was sent successfully
      setMessageInput("")
      setShowGiphySearch(false)

      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Error sending message:", error)
      addInAppNotification("error", "Failed to send message")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const disconnectFromChat = () => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      // If already disconnected, just clean up the UI
      setIsConnected(false)
      setMessages([])
      setUsername("")
      setPartnerName(null)
      setIsWaitingForPartner(false)
      setSystemMessage(null)
      return
    }

    try {
      // Send leave message
      const leaveMessage = {
        type: "LEAVE",
        sender: usernameRef.current,
        content: `${usernameRef.current} has left the chat`,
        timestamp: new Date().toISOString(),
      }

      webSocketRef.current.send(JSON.stringify(leaveMessage))

      // Close the connection
      webSocketRef.current.close()

      // Update UI state
      setIsConnected(false)
      setMessages([])
      setUsername("")
      setPartnerName(null)
      setIsWaitingForPartner(false)
      setSystemMessage(null)

      addInAppNotification("info", "You have left the chat")
    } catch (error) {
      console.error("Error disconnecting:", error)

      // Force disconnect on error
      if (webSocketRef.current) {
        webSocketRef.current.close()
      }

      setIsConnected(false)
      setMessages([])
      setUsername("")
      setPartnerName(null)
      setIsWaitingForPartner(false)
      setSystemMessage(null)

      addInAppNotification("error", "Error while disconnecting")
    }
  }

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
      addInAppNotification("error", "Failed to search for GIFs")
    } finally {
      setIsSearchingGiphy(false)
    }
  }

  const sendGif = (gifUrl: string) => {
    sendMessage(gifUrl, true)
  }

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput((prev) => prev + emoji.native)
  }

  const removeNotification = (id: string) => {
    setInAppNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Toggle debug mode

  // Handle system message auto-removal
  useEffect(() => {
    if (systemMessage) {
      // For connection messages, keep them visible longer
      const isConnectionMessage = systemMessage.includes("You are now chatting with")
      const timeout = isConnectionMessage ? 15000 : 8000

      systemMessageTimeoutRef.current = setTimeout(() => {
        console.log("Auto-removing system message:", systemMessage)
        setSystemMessage(null)
      }, timeout)

      return () => {
        if (systemMessageTimeoutRef.current) {
          clearTimeout(systemMessageTimeoutRef.current)
        }
      }
    }
  }, [systemMessage])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="absolute top-4 right-4 flex space-x-2">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Thunder Chat</h1>
            <p className="text-muted-foreground">Connect anonymously with random people around the world</p>
          </div>

          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Start Chatting</CardTitle>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Enter a username to be paired with a random person for a private chat
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Choose a username
                  </label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isConnecting && connectToChat()}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={connectToChat} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Random Chat
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium">Anonymous</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chat without revealing your identity</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium">One-on-One</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Private conversations with one person at a time
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium">New Connections</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find a new chat partner anytime</p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">Made with ❤️ by Ankit Panchal</div>
        </div>

        {/* In-app notifications */}
        <div className="fixed bottom-4 left-0 right-0 flex flex-col items-center space-y-2 z-50 pointer-events-none">
          {inAppNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center justify-between px-4 py-2 rounded-full shadow-md max-w-xs animate-in fade-in slide-in-from-bottom-5 pointer-events-auto
                ${
                  notification.type === "success"
                    ? "bg-green-500 text-white"
                    : notification.type === "error"
                      ? "bg-red-500 text-white"
                      : notification.type === "warning"
                        ? "bg-yellow-500 text-white"
                        : "bg-blue-500 text-white"
                }`}
            >
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-white opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between p-4 bg-card shadow fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Thunder Chat</h1>
          <Badge variant={isConnected ? "success" : "destructive"} className="ml-2">
            {isWaitingForPartner ? "Waiting" : isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {/* Debug mode toggle */}

          <ThemeToggle />

          {/* Clear chat button */}
          <Button variant="outline" size="sm" onClick={clearChat} className="mr-2" title="Clear chat history">
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Mobile Find New Partner button */}
          <div className="block md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={findNewPartner}
              disabled={!isConnected || isWaitingForPartner}
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="sr-only md:not-sr-only">New</span>
            </Button>
          </div>

          {/* Mobile drawer for partner info */}
          <div className="block md:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="relative flex items-center">
                  <UserRound className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only">Info</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="p-4">
                  <h2 className="font-semibold mb-4">Chat Info</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{username} (You)</div>
                      </div>
                    </div>

                    {partnerName ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-secondary">
                            {partnerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{partnerName}</div>
                          <div className="text-xs text-muted-foreground">Your chat partner</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm italic">Waiting for a partner to connect...</div>
                    )}

                    <div className="pt-4 space-y-2">
                      <Button variant="outline" className="w-full" onClick={findNewPartner} disabled={!isConnected}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Find New Partner
                      </Button>

                      <Button variant="outline" className="w-full" onClick={clearChat}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Chat
                      </Button>

                      <Button variant="destructive" className="w-full" onClick={disconnectFromChat}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{username}</span>
            <Button variant="outline" size="sm" onClick={disconnectFromChat}>
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* NEW: System message banner */}
      {systemMessage && (
        <div className="fixed top-16 left-0 right-0 bg-muted text-muted-foreground text-center py-2 z-10">
          <p className="italic">{systemMessage}</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-full h-full">
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
                        <img
                          src={msg.content || "/placeholder.svg"}
                          alt="GIF"
                          className="rounded-md max-w-full h-auto"
                        />
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
                        onClick={() => sendGif(gif.images.original.url)}
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
                      // When input is focused, scroll to bottom
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                      }, 300)
                    }}
                    disabled={!isConnected || isWaitingForPartner}
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={() => sendMessage()}
                  disabled={!isConnected || isWaitingForPartner || !messageInput.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:w-1/4 flex-col border-l border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Chat Info</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{username} (You)</div>
              </div>
            </div>

            {partnerName ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary">{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{partnerName}</div>
                  <div className="text-xs text-muted-foreground">Your chat partner</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm italic">Waiting for a partner to connect...</div>
            )}

            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" onClick={findNewPartner} disabled={!isConnected}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Find New Partner
              </Button>

              <Button variant="outline" className="w-full" onClick={clearChat}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* In-app notifications */}
      <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center space-y-2 z-50 pointer-events-none">
        {inAppNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between px-4 py-2 rounded-full shadow-md max-w-xs animate-in fade-in slide-in-from-bottom-5 pointer-events-auto
              ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : notification.type === "error"
                    ? "bg-red-500 text-white"
                    : notification.type === "warning"
                      ? "bg-yellow-500 text-white"
                      : "bg-blue-500 text-white"
              }`}
          >
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-white opacity-70 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="py-2 text-center text-sm text-muted-foreground bg-card border-t border-border">
        Made with ❤️ by Ankit Panchal
      </div>
    </div>
  )
}
