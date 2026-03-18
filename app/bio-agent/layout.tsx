import { cookies } from "next/headers"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "@/components/layout/ChatSidebar"

export default async function BioAgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full">
        <ChatSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
