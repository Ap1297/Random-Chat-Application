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
import { Loader2, UserRound, RefreshCw, Smile, ImageIcon, MessageSquare } from "lucide-react"
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
  const webSocketRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  // Update the constants to make it easier to switch between environments
  const BACKEND_PROD = "wss://random-chat-application.onrender.com/chat"
  const BACKEND_LOCAL = "ws://localhost:8080/chat"
  // Use local backend for development, production for deployment
  const BACKEND_URL = process.env.NODE_ENV === "development" ? BACKEND_LOCAL : BACKEND_PROD
  const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65" // Replace with your Giphy API key

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

  // Auto-scroll when keyboard appears on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle system messages with auto-removal
  useEffect(() => {
    const systemMessages = messages.filter(
      (msg) => msg.type === "PARTNER_CONNECTED" || msg.type === "PARTNER_DISCONNECTED" || msg.type === "SYSTEM",
    )

    if (systemMessages.length > 0) {
      const timeoutIds = systemMessages.map((msg) => {
        return setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m !== msg))
        }, 5000) // Remove after 5 seconds
      })

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id))
      }
    }
  }, [messages])

  const connectToChat = () => {
    console.log("Connect to chat function called")
    if (!usernameInput.trim()) {
      console.log("Username is empty")
      toast({
        title: "Username required",
        description: "Please enter a username to start chatting",
        variant: "destructive",
      })
      return
    }

    // Add this console log before creating the WebSocket
    console.log("Creating WebSocket connection to:", BACKEND_URL)
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
        toast({
          title: "Connection error",
          description: "Failed to connect to the chat server",
          variant: "destructive",
        })
      }

      ws.onopen = () => {
        console.log("WebSocket connection opened successfully")
        setIsConnected(true)
        setIsConnecting(false)
        setUsername(usernameInput)
        toast({
          title: "Connected!",
          description: `Looking for someone to chat with...`,
        })

        // Send join message
        const joinMessage = {
          type: "JOIN",
          sender: usernameInput,
          content: `Looking for a chat partner...`,
          timestamp: new Date().toISOString(),
        }

        try {
          ws.send(JSON.stringify(joinMessage))
          console.log("Join message sent:", joinMessage)
        } catch (error) {
          console.error("Error sending join message:", error)
        }

        // Add a waiting message
        setMessages([
          {
            type: "WAITING",
            sender: "system",
            content: "Waiting for someone to connect...",
            timestamp: new Date().toISOString(),
          },
        ])
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log("Received message:", message)

          if (message.type === "USERS") {
            // For 1-on-1 chat, we'll use this to determine if we have a partner
            if (message.users && message.users.length === 2) {
              const partner = message.users.find((user: string) => user !== usernameInput)
              if (partner) {
                setPartnerName(partner)
                setIsWaitingForPartner(false)

                // Show toast instead of adding to messages
                toast({
                  title: "Partner found!",
                  description: `You are now chatting with ${partner}`,
                })
              }
            }
          } else if (message.type === "PARTNER_CONNECTED") {
            // Direct notification that a partner has connected
            const partnerUsername = message.content.replace("You are now chatting with ", "")

            // Make sure we don't set ourselves as the partner
            if (partnerUsername !== usernameInput) {
              setPartnerName(partnerUsername)
              setIsWaitingForPartner(false)

              // Show toast instead of adding to messages
              toast({
                title: "Partner found!",
                description: message.content,
              })

              // Also add to messages but it will auto-remove
              setMessages((prev) => [
                ...prev.filter((msg) => msg.type !== "WAITING"), // Remove waiting message
                message,
              ])
            }
          } else if (message.type === "PARTNER_DISCONNECTED") {
            // Partner disconnected
            setMessages((prev) => [...prev, message])
            setPartnerName(null)
            setIsWaitingForPartner(true)

            toast({
              title: "Partner disconnected",
              description: "Looking for a new partner...",
              variant: "destructive",
            })
          } else if (message.type === "CHAT") {
            // Only add messages from the partner, not our own messages
            // Our own messages are added locally when we send them
            if (message.sender !== username) {
              setMessages((prev) => [...prev, message])

              // Auto-scroll to bottom when new message arrives
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
                }
              }, 100)
            }
          } else if (message.type === "SYSTEM") {
            // System messages
            setMessages((prev) => [...prev, message])
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
        toast({
          title: "Disconnected",
          description: "You have been disconnected from the chat",
          variant: "destructive",
        })
      }

      webSocketRef.current = ws
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      setIsConnecting(false)
      setIsWaitingForPartner(false)
      toast({
        title: "Connection error",
        description: "Failed to create WebSocket connection",
        variant: "destructive",
      })
    }
  }

  const findNewPartner = () => {
    if (!isConnected || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot find new partner: WebSocket not connected")
      toast({
        title: "Connection error",
        description: "Not connected to chat server",
        variant: "destructive",
      })
      return
    }

    setPartnerName(null)
    setIsWaitingForPartner(true)
    setMessages([
      {
        type: "WAITING",
        sender: "system",
        content: "Looking for a new partner...",
        timestamp: new Date().toISOString(),
      },
    ])

    // Send a message to find a new partner
    const findNewMessage = {
      type: "FIND_NEW",
      sender: username,
      content: `${username} is looking for a new partner`,
      timestamp: new Date().toISOString(),
    }

    try {
      webSocketRef.current.send(JSON.stringify(findNewMessage))
      console.log("Find new partner message sent:", findNewMessage)

      toast({
        title: "Finding new partner",
        description: "Please wait while we find someone new to chat with...",
      })
    } catch (error) {
      console.error("Error sending find new partner message:", error)
      toast({
        title: "Error",
        description: "Failed to find a new partner",
        variant: "destructive",
      })
    }
  }

  const sendMessage = (content = messageInput, isGif = false) => {
    console.log("Sending message:", content, "isGif:", isGif)

    if ((!content.trim() && !isGif) || !isConnected || isWaitingForPartner) {
      console.log("Cannot send message: empty content or not connected or waiting for partner")
      return
    }

    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: WebSocket not connected")
      toast({
        title: "Connection error",
        description: "Not connected to chat server",
        variant: "destructive",
      })
      return
    }

    // Create a message object
    const message: ChatMessage = {
      type: "CHAT",
      sender: username,
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

      console.log("Message sent successfully:", message)

      // Add the message locally to ensure it appears immediately
      setMessages((prev) => [...prev, message])

      // Only clear input and hide GIF search if the message was sent successfully
      setMessageInput("")
      setShowGiphySearch(false)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
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
      return
    }

    try {
      // Send leave message
      const leaveMessage = {
        type: "LEAVE",
        sender: username,
        content: `${username} has left the chat`,
        timestamp: new Date().toISOString(),
      }

      webSocketRef.current.send(JSON.stringify(leaveMessage))
      console.log("Leave message sent:", leaveMessage)

      // Close the connection
      webSocketRef.current.close()

      // Update UI state
      setIsConnected(false)
      setMessages([])
      setUsername("")
      setPartnerName(null)
      setIsWaitingForPartner(false)

      toast({
        title: "Disconnected",
        description: "You have left the chat",
      })
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

      toast({
        title: "Error",
        description: "There was an error while disconnecting",
        variant: "destructive",
      })
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
      toast({
        title: "Error",
        description: "Failed to search for GIFs",
        variant: "destructive",
      })
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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="absolute top-4 right-4">
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
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between p-4 bg-card shadow sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Thunder Chat</h1>
          <Badge variant={isConnected ? "success" : "destructive"} className="ml-2">
            {isWaitingForPartner ? "Waiting" : isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />

          {/* Mobile drawer for partner info */}
          <div className="block md:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <UserRound className="h-4 w-4" />
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-full h-full">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === username ? "justify-end" : msg.sender === "system" ? "justify-center" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === username
                        ? "bg-primary text-primary-foreground"
                        : msg.sender === "system"
                          ? "bg-muted text-muted-foreground text-center italic w-full max-w-md"
                          : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.sender !== "system" && msg.sender !== username && (
                      <div className="font-semibold text-xs mb-1">{msg.sender}</div>
                    )}
                    {msg.isGif ? (
                      <img src={msg.content || "/placeholder.svg"} alt="GIF" className="rounded-md max-w-full h-auto" />
                    ) : (
                      <div>{msg.content}</div>
                    )}
                    {msg.sender !== "system" && (
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {showGiphySearch && (
            <div className="p-4 bg-card border-t border-border">
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

          <div className="p-4 bg-card border-t border-border sticky bottom-0">
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
                    placeholder={isWaitingForPartner ? "Waiting for a partner..." : "Type a message..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
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
            </div>
          </div>
        </div>
      </div>

      <div className="py-2 text-center text-sm text-muted-foreground bg-card border-t border-border">
        Made with ❤️ by Ankit Panchal
      </div>
    </div>
  )
}
