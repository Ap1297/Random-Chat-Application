"use client"

import { useState, useEffect } from "react"
import type { ChatMessage } from "@/types/chat"
import { useChatConnection } from "@/hooks/use-chat-connection"
import { useNotifications } from "@/hooks/use-notifications"
import { useSystemMessage } from "@/hooks/use-system-message"
import { LoginScreen } from "@/components/chat/login-screen"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { PartnerSidebar } from "@/components/chat/partner-sidebar"
import { NotificationList } from "@/components/chat/notification-list"

interface InAppNotification {
  id: string
  type: "success" | "warning" | "error" | "info"
  message: string
  timestamp: number
  key?: string
}

export default function ChatPage() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState("")
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  // Custom hooks
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { systemMessage, updateSystemMessage } = useSystemMessage()

  // Handle WebSocket messages
  const handleMessage = (message: ChatMessage) => {
    if (message.type === "USERS") {
      // For 1-on-1 chat, we'll use this to determine if we have a partner
      if (message.users && message.users.length === 2) {
        const partner = message.users.find((user: string) => user !== username)

        if (partner && !partnerName) {
          // Only update if we don't already have a partner
          setPartnerName(partner)
          setIsWaitingForPartner(false)
          addNotification("success", `Now chatting with ${partner}`)
          updateSystemMessage(`You are now chatting with ${partner}`)
        }
      }
    } else if (message.type === "PARTNER_CONNECTED") {
      // Direct notification that a partner has connected
      // Extract the partner username from the message content
      const partnerUsername = message.content.replace("You are now chatting with ", "")

      // Make sure we don't set ourselves as the partner
      if (partnerUsername !== username) {
        setPartnerName(partnerUsername)
        setIsWaitingForPartner(false)
        addNotification("success", `Now chatting with ${partnerUsername}`)
        updateSystemMessage(`You are now chatting with ${partnerUsername}`)
      }
    } else if (message.type === "PARTNER_DISCONNECTED") {
      // Partner disconnected
      setPartnerName(null)
      setIsWaitingForPartner(true)
      addNotification("warning", "Partner disconnected. Looking for a new partner...")
      updateSystemMessage("Looking for a new chat partner...")
    } else if (message.type === "CHAT") {
      // Only add messages from the partner, not our own messages
      // Our own messages are added locally when we send them
      if (message.sender !== username) {
        // Add the message to the chat history
        setMessages((prev) => [...prev, message])
      }
    } else if (message.type === "SYSTEM") {
      // System messages - update the system message state
      updateSystemMessage(message.content)
    }
  }

  // Initialize chat connection
  const { isConnecting, connect, disconnect, findNewPartner, sendMessage } = useChatConnection({
    onMessage: handleMessage,
    onConnectionChange: (connected) => {
      setIsConnected(connected)
      if (!connected) {
        setMessages([])
        setUsername("")
        setPartnerName(null)
        setIsWaitingForPartner(false)
      }
    },
    onWaitingChange: setIsWaitingForPartner,
  })

  // Handle keyboard visibility on mobile
  useEffect(() => {
    // Function to detect keyboard visibility
    const detectKeyboard = () => {
      // On mobile, when keyboard appears, the viewport height decreases
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75
      setIsKeyboardVisible(isKeyboard)
    }

    // Listen for resize events which happen when keyboard appears/disappears
    window.addEventListener("resize", detectKeyboard)

    // Initial check
    detectKeyboard()

    return () => {
      window.removeEventListener("resize", detectKeyboard)
    }
  }, [])

  // Handle connection
  const handleConnect = (usernameInput: string) => {
    const success = connect(usernameInput)
    if (success) {
      setUsername(usernameInput)
      addNotification("success", "Connected! Looking for a chat partner...")
      updateSystemMessage("Waiting for a chat partner...")
    } else {
      addNotification("error", "Failed to connect")
    }
  }

  // Handle disconnection
  const handleDisconnect = () => {
    const success = disconnect()
    if (success) {
      addNotification("info", "You have left the chat")
    } else {
      addNotification("error", "Error while disconnecting")
    }
  }

  // Handle finding a new partner
  const handleFindNewPartner = () => {
    const success = findNewPartner()
    if (success) {
      setPartnerName(null)
      addNotification("info", "Finding a new partner...")
      updateSystemMessage("Looking for a new chat partner...")
    } else {
      addNotification("error", "Failed to find a new partner")
    }
  }

  // Handle sending a message
  const handleSendMessage = (content: string, isGif = false) => {
    const success = sendMessage(content, isGif)
    if (success) {
      // Add the message locally to ensure it appears immediately
      const message: ChatMessage = {
        type: "CHAT",
        sender: username,
        content: content,
        timestamp: new Date().toISOString(),
        isGif: isGif,
        isLocal: true,
      }
      setMessages((prev) => [...prev, message])
    } else {
      addNotification("error", "Failed to send message")
    }
  }

  // Handle clearing chat
  const handleClearChat = () => {
    setMessages([])
    addNotification("info", "Chat cleared")
  }

  // If not connected, show login screen
  if (!isConnected) {
    return (
      <>
        <LoginScreen onConnect={handleConnect} isConnecting={isConnecting} />
        <NotificationList notifications={notifications} onRemoveNotification={removeNotification} position="bottom" />
      </>
    )
  }

  // Otherwise, show chat interface
  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader
        username={username}
        partnerName={partnerName}
        isConnected={isConnected}
        isWaitingForPartner={isWaitingForPartner}
        onDisconnect={handleDisconnect}
        onFindNewPartner={handleFindNewPartner}
        onClearChat={handleClearChat}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-full h-full">
          <MessageList
            messages={messages}
            username={username}
            systemMessage={systemMessage}
            isKeyboardVisible={isKeyboardVisible}
          />

          <MessageInput
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
            isWaitingForPartner={isWaitingForPartner}
          />
        </div>

        <PartnerSidebar
          username={username}
          partnerName={partnerName}
          onFindNewPartner={handleFindNewPartner}
          onClearChat={handleClearChat}
          isConnected={isConnected}
        />
      </div>

      <NotificationList notifications={notifications} onRemoveNotification={removeNotification} />

      <div className="py-2 text-center text-sm text-muted-foreground bg-card border-t border-border">
        Made with ❤️ by Ankit Panchal
      </div>
    </div>
  )
}
