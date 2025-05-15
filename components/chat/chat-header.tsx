"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Trash2, RefreshCw, UserRound } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

interface ChatHeaderProps {
  username: string
  partnerName: string | null
  isConnected: boolean
  isWaitingForPartner: boolean
  onDisconnect: () => void
  onFindNewPartner: () => void
  onClearChat: () => void
}

export function ChatHeader({
  username,
  partnerName,
  isConnected,
  isWaitingForPartner,
  onDisconnect,
  onFindNewPartner,
  onClearChat,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-card shadow fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">Thunder Chat</h1>
        <Badge variant={isConnected ? "success" : "destructive"} className="ml-2">
          {isWaitingForPartner ? "Waiting" : isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <ThemeToggle />

        {/* Clear chat button */}
        <Button variant="outline" size="sm" onClick={onClearChat} className="mr-2" title="Clear chat history">
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Mobile Find New Partner button */}
        <div className="block md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={onFindNewPartner}
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

                    <Button variant="destructive" className="w-full" onClick={onDisconnect}>
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
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            Leave
          </Button>
        </div>
      </div>
    </div>
  )
}
