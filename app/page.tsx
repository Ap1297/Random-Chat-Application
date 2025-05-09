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
import { Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface ChatMessage {
  id?: string
  type: "CHAT" | "JOIN" | "LEAVE" | "USERS"
  sender: string
  content: string
  timestamp: string
  users?: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const webSocketRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const connectToChat = () => {
    if (!usernameInput.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to join the chat",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    const ws = new WebSocket("ws://localhost:8080/chat")

    ws.onopen = () => {
      setIsConnected(true)
      setIsConnecting(false)
      setUsername(usernameInput)
      toast({
        title: "Connected!",
        description: `Welcome to the chat, ${usernameInput}!`,
      })

      // Send join message
      const joinMessage = {
        type: "JOIN",
        sender: usernameInput,
        content: `${usernameInput} has joined the chat`,
        timestamp: new Date().toISOString(),
      }
      ws.send(JSON.stringify(joinMessage))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === "USERS") {
        setOnlineUsers(message.users)
      } else {
        setMessages((prev) => [...prev, message])
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      setIsConnecting(false)
      toast({
        title: "Connection error",
        description: "Failed to connect to the chat server",
        variant: "destructive",
      })
    }

    ws.onclose = () => {
      setIsConnected(false)
      setIsConnecting(false)
      toast({
        title: "Disconnected",
        description: "You have been disconnected from the chat",
        variant: "destructive",
      })
    }

    webSocketRef.current = ws
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !isConnected) return

    const message = {
      type: "CHAT",
      sender: username,
      content: messageInput,
      timestamp: new Date().toISOString(),
    }

    webSocketRef.current?.send(JSON.stringify(message))
    setMessageInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
      setOnlineUsers([])
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
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Join Random Chat</CardTitle>
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
                "Join Chat"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex flex-col w-full md:w-3/4 h-full">
        <div className="flex items-center justify-between p-4 bg-card shadow">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Random Chat</h1>
            <Badge variant={isConnected ? "success" : "destructive"} className="ml-2">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
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

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === username ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === username
                      ? "bg-primary text-primary-foreground"
                      : msg.type === "JOIN" || msg.type === "LEAVE"
                        ? "bg-muted text-muted-foreground text-center italic w-full"
                        : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.type !== "JOIN" && msg.type !== "LEAVE" && msg.sender !== username && (
                    <div className="font-semibold text-xs mb-1">{msg.sender}</div>
                  )}
                  <div>{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-card border-t border-border">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!isConnected}
            />
            <Button onClick={sendMessage} disabled={!isConnected || !messageInput.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:w-1/4 flex-col border-l border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Online Users ({onlineUsers.length})</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {onlineUsers.map((user, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={user === username ? "font-semibold" : ""}>
                  {user} {user === username && "(You)"}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
