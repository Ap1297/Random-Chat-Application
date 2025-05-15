"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RefreshCw, Trash2 } from "lucide-react"

interface PartnerSidebarProps {
  username: string
  partnerName: string | null
  onFindNewPartner: () => void
  onClearChat: () => void
  isConnected: boolean
}

export function PartnerSidebar({
  username,
  partnerName,
  onFindNewPartner,
  onClearChat,
  isConnected,
}: PartnerSidebarProps) {
  return (
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
          <Button variant="outline" className="w-full" onClick={onFindNewPartner} disabled={!isConnected}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Find New Partner
          </Button>

          <Button variant="outline" className="w-full" onClick={onClearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
