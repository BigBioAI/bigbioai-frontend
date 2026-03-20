import { cookies } from "next/headers"
import { ChatSidebar } from "@/components/layout/ChatSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function HomePage() {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ChatSidebar />
      <SidebarInset>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">BigBioAI</h1>
            <p className="text-lg text-muted-foreground">BioInformatics AI Agent</p>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
