'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "@/components/layout/ChatSidebar"

export default function BioAgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ChatSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}