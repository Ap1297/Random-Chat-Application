"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageSquare, UserRound, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { EmojiPicker } from "./emoji-picker"
import { GifPicker } from "./gif-picker"

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
  const webSocketRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const BACKEND_PROD = "wss://random-chat-application.onrender.com/chat"
  const BACKEND_LOCAL = "ws://localhost:8080/chat"

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
    if (!usernameInput.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to start chatting",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    setIsWaitingForPartner(true)
    // Use the production backend URL
    const ws = new WebSocket(BACKEND_PROD)

    ws.onopen = () => {
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
      ws.send(JSON.stringify(joinMessage))

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
      const message = JSON.parse(event.data)
      console.log("Received message:", message)

      if (message.type === "USERS") {
        // For 1-on-1 chat, we'll use this to determine if we have a partner
        if (message.users && message.users.length === 2) {
          const partner = message.users.find((user: string) => user !== username)
          if (partner && !partnerName) {
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
        // Only show messages from our partner or ourselves
        setMessages((prev) => [...prev, message])

        // Auto-scroll to bottom when new message arrives
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)
      } else if (message.type === "SYSTEM") {
        // System messages
        setMessages((prev) => [...prev, message])
      }
    }

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

    ws.onclose = () => {
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
  }

  const findNewPartner = () => {
    if (!isConnected) return

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
    webSocketRef.current?.send(JSON.stringify(findNewMessage))

    toast({
      title: "Finding new partner",
      description: "Please wait while we find someone new to chat with...",
    })
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji)
  }

  const handleGifSelect = (gifUrl: string) => {
    sendMessage(gifUrl, true)
  }

  const sendMessage = (content = messageInput, isGif = false) => {
    if ((!content.trim() && !isGif) || !isConnected || isWaitingForPartner) return

    const message = {
      type: "CHAT",
      sender: username,
      content: content,
      timestamp: new Date().toISOString(),
      isGif: isGif,
    }

    webSocketRef.current?.send(JSON.stringify(message))
    setMessageInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const disconnectFromChat = () => {
    if (webSocketRef.current) {
      // Send leave message
      const leaveMessage = {
        type: "LEAVE",
        sender: username,
        content: `${username} has left the chat`,
        timestamp: new Date().toISOString(),
      }
      webSocketRef.current.send(JSON.stringify(leaveMessage))

      webSocketRef.current.close()
      setIsConnected(false)
      setMessages([])
      setUsername("")
      setPartnerName(null)
      setIsWaitingForPartner(false)
      toast({
        title: "Disconnected",
        description: "You have left the chat",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Thunder Chat</h1>
            <p className="text-muted-foreground">Connect anonymously with random people around the world</p>
          </div>

          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Start Chatting</CardTitle>
              <CardDescription className="text-center">
                Enter a username to be paired with a random person for a private chat
              </CardDescription>
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
                    disabled={isConnecting}
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

          <div className="mt-8 space-y-4 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg shadow">
                <MessageSquare className="mx-auto h-6 w-6 mb-2" />
                <h3 className="font-medium">Anonymous</h3>
                <p className="text-sm text-muted-foreground">Chat without revealing your identity</p>
              </div>
              <div className="bg-card p-4 rounded-lg shadow">
                <UserRound className="mx-auto h-6 w-6 mb-2" />
                <h3 className="font-medium">One-on-One</h3>
                <p className="text-sm text-muted-foreground">Private conversations with one person at a time</p>
              </div>
              <div className="bg-card p-4 rounded-lg shadow">
                <RefreshCw className="mx-auto h-6 w-6 mb-2" />
                <h3 className="font-medium">New Connections</h3>
                <p className="text-sm text-muted-foreground">Find a new chat partner anytime</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">Made with ❤️ by Ankit Panchal</div>
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
          <ScrollArea className="flex-1 p-4">
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

          <div className="p-4 bg-card border-t border-border sticky bottom-0">
            <div className="flex space-x-2">
              <div className="flex space-x-2 flex-1">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                <GifPicker onGifSelect={handleGifSelect} />
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
