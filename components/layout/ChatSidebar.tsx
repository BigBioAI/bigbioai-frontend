"use client";

import * as React from "react";
import {
  MessageSquarePlus,
  Search,
  ChevronRight,
  Layers,
  BookOpen,
  Settings,
  Star,
  History as HistoryIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInput,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, state, setOpen } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;
  const matches = React.useCallback(
    (label: string) => label.toLowerCase().includes(normalizedQuery),
    [normalizedQuery],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const shouldShowHistorySection =
    !isFiltering ||
    matches("History") ||
    matches("Starred") ||
    matches("Settings") ||
    matches("Models") ||
    matches("Documentation");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                "flex items-center gap-2",
                state === "collapsed" && "justify-center",
              )}
            >
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "cursor-default hover:bg-transparent active:bg-transparent",
                  state === "collapsed" && "hidden",
                )}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <div className="size-4" />
                </div>
                {state === "expanded" && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">BigBioAI</span>
                    <span className="truncate text-xs">
                      BioInformatics AI Agent
                    </span>
                  </div>
                )}
              </SidebarMenuButton>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "size-8 shrink-0 cursor-pointer rounded-xl border-sidebar-border bg-background shadow-sm hover:bg-sidebar-accent",
                  state === "collapsed" && "mx-auto",
                )}
                aria-label={
                  state === "expanded" ? "사이드바 최소화" : "사이드바 최대화"
                }
              >
                {state === "expanded" ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeftOpen className="size-4" />
                )}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        {isSearchOpen && (
          <SidebarInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="메뉴 검색..."
            aria-label="사이드바 메뉴 검색"
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>BigBioAI</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(!isFiltering || matches("New Chat")) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    isActive={pathname.startsWith("/bio-agent")}
                    onClick={() => router.push("/bio-agent")}
                  >
                    <MessageSquarePlus />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(!isFiltering || matches("Search")) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    isActive={isSearchOpen}
                    onClick={() => {
                      if (state === "collapsed") {
                        setOpen(true);
                        setIsSearchOpen(true);
                        return;
                      }

                      setIsSearchOpen((prev) => !prev);
                    }}
                  >
                    <Search />
                    <span>Search</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {shouldShowHistorySection && (
          <SidebarGroup>
            <SidebarGroupLabel>My Chat</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(!isFiltering ||
                  matches("History") ||
                  matches("Starred") ||
                  matches("Settings")) && (
                  <Collapsible
                    defaultOpen={isFiltering}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="cursor-pointer">
                          <HistoryIcon />
                          <span>History</span>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {(!isFiltering || matches("History")) && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton className="cursor-pointer">
                                <HistoryIcon />
                                <span>History</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {(!isFiltering || matches("Starred")) && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton className="cursor-pointer">
                                <Star />
                                <span>Starred</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                          {(!isFiltering || matches("Settings")) && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton className="cursor-pointer">
                                <Settings />
                                <span>Settings</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
                {(!isFiltering || matches("Models")) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton className="cursor-pointer">
                      <Layers />
                      <span>Models</span>
                      <ChevronRight className="ml-auto" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {(!isFiltering || matches("Documentation")) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton className="cursor-pointer">
                      <BookOpen />
                      <span>Documentation</span>
                      <ChevronRight className="ml-auto" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {(!isFiltering || matches("Settings")) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton className="cursor-pointer">
                      <Settings />
                      <span>Settings</span>
                      <ChevronRight className="ml-auto" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-pointer">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/images/avatar-image.png" alt="User" />
                <AvatarFallback className="rounded-lg">SC</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Shadcn</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
