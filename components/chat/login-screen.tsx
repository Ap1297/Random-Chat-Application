"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageSquare } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface LoginScreenProps {
  onConnect: (username: string) => void
  isConnecting: boolean
}

export function LoginScreen({ onConnect, isConnecting }: LoginScreenProps) {
  const [usernameInput, setUsernameInput] = useState("")

  const handleConnect = () => {
    if (usernameInput.trim()) {
      onConnect(usernameInput)
    }
  }

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
                  onKeyDown={(e) => e.key === "Enter" && !isConnecting && handleConnect()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleConnect} disabled={isConnecting}>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Private conversations with one person at a time</p>
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
