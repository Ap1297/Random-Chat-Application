export interface ChatMessage {
  id?: string
  type: "CHAT" | "JOIN" | "LEAVE" | "USERS"
  sender: string
  content: string
  timestamp: string
  users?: string[]
}
