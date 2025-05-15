export interface ChatMessage {
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
  isLocal?: boolean
}

export interface InAppNotification {
  id: string
  type: "success" | "warning" | "error" | "info"
  message: string
  timestamp: number
  key?: string
}
