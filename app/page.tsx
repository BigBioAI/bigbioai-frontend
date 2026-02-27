import { ChatSidebar } from "@/components/layout/ChatSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function HomePage() {
  return (
    <SidebarProvider>
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
