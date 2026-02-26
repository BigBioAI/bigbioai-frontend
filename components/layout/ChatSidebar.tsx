"use client"

import * as React from "react"
import { MessageSquarePlus, Search, ChevronDown, ChevronRight, Layers, BookOpen, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(true)

  return (
    <aside 
      data-state="open"
      className={cn(
        "w-80 h-full bg-sidebar rounded-[10px] border border-sidebar-border flex flex-col justify-between",
        className
      )}
    >
      <div className="p-2 flex flex-col gap-2">
        <div className="p-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-[10px] flex items-center justify-center">
            <div className="w-4 h-4 relative overflow-hidden">
              <div className="w-3 h-[13.33px] absolute left-0.5 top-[1.33px] border border-sidebar-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <h2 className="text-sidebar-foreground text-sm font-semibold leading-5">BigBioAI</h2>
            <p className="text-sidebar-foreground text-xs font-normal leading-4">BioInformatics AI Agent</p>
          </div>
          <button className="w-4 h-4 relative overflow-hidden">
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          </button>
        </div>
      </div>

      <div className="p-2 flex flex-col">
        <div className="h-8 px-2 opacity-70 flex items-center gap-2">
          <span className="flex-1 text-sidebar-foreground text-xs font-normal leading-4">BigBioAI</span>
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className="justify-start gap-2 h-8 px-2 text-sm font-normal rounded-lg">
            <MessageSquarePlus className="w-4 h-4" />
            <span className="flex-1 text-left">New Chat</span>
          </Button>
          <Button variant="ghost" className="justify-start gap-2 h-8 px-2 text-sm font-normal rounded-lg">
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-2 overflow-y-auto">
        <div className="h-8 px-2 opacity-70 flex items-center gap-2">
          <span className="flex-1 text-sidebar-foreground text-xs font-normal leading-4">My Chat</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="h-8 p-2 rounded-lg flex items-center gap-2 hover:bg-accent transition-colors"
            >
              <span className="flex-1 text-sidebar-foreground text-sm font-normal leading-5 text-left">History</span>
              {isHistoryOpen ? <ChevronDown className="w-4 h-4 text-sidebar-foreground" /> : <ChevronRight className="w-4 h-4 text-sidebar-foreground" />}
            </button>
            {isHistoryOpen && (
              <div className="px-3.5">
                <div className="flex-1 px-2.5 py-0.5 border-l border-sidebar-border flex flex-col gap-1">
                  <Button variant="ghost" className="h-7 px-2 justify-start text-sm font-normal rounded-lg">History</Button>
                  <Button variant="ghost" className="h-7 px-2 justify-start text-sm font-normal rounded-lg">Starred</Button>
                  <Button variant="ghost" className="h-7 px-2 justify-start text-sm font-normal rounded-lg">Settings</Button>
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" className="h-8 p-2 justify-start gap-2 rounded-lg">
            <Layers className="w-4 h-4" />
            <span className="flex-1 text-left text-sm font-normal">Models</span>
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          </Button>
          <Button variant="ghost" className="h-8 p-2 justify-start gap-2 rounded-lg">
            <BookOpen className="w-4 h-4" />
            <span className="flex-1 text-left text-sm font-normal">Documentation</span>
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          </Button>
          <Button variant="ghost" className="h-8 p-2 justify-start gap-2 rounded-lg">
            <Settings className="w-4 h-4" />
            <span className="flex-1 text-left text-sm font-normal">Settings</span>
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          </Button>
        </div>
      </div>

      <div className="p-2">
        <div className="p-2 flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/images/avatar-image.png" alt="User" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col">
            <span className="text-sidebar-foreground text-sm font-semibold leading-5">Shadcn</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
