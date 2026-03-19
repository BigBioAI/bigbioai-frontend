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
  Trash2,
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
import {
  clearChatHistory,
  getChatHistory,
  onChatHistoryUpdated,
  removeChatHistoryById,
  type ChatHistoryItem,
} from "@/lib/chatHistory";

function formatHistoryDate(date: Date) {
  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, state, setOpen } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isClientReady, setIsClientReady] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<ChatHistoryItem[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;
  const matches = React.useCallback(
    (label: string) => label.toLowerCase().includes(normalizedQuery),
    [normalizedQuery],
  );

  React.useEffect(() => {
    setIsClientReady(true);
  }, []);

  React.useEffect(() => {
    if (!isClientReady) {
      return;
    }

    const syncHistory = () => {
      setChatHistory(getChatHistory());
    };

    syncHistory();
    return onChatHistoryUpdated(syncHistory);
  }, [isClientReady]);

  React.useEffect(() => {
    if (isFiltering) {
      setIsHistoryOpen(true);
    }
  }, [isFiltering]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (state === "collapsed") {
          setOpen(true);
          setIsSearchOpen(true);
          return;
        }

        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen, state]);

  React.useEffect(() => {
    if (!isSearchOpen || state !== "expanded") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isSearchOpen, state]);

  const shouldShowHistorySection =
    !isFiltering ||
    matches("History") ||
    matches("Starred") ||
    matches("Settings") ||
    matches("Models") ||
    matches("Documentation");

  const filteredHistory = chatHistory.filter((item) => {
    if (!isFiltering) return true;

    const title = item.title.toLowerCase();
    const latestMessage = item.messages.at(-1)?.content.toLowerCase() ?? "";
    return (
      title.includes(normalizedQuery) || latestMessage.includes(normalizedQuery)
    );
  });

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
            ref={searchInputRef}
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
                {isClientReady &&
                  (!isFiltering ||
                    matches("History") ||
                    matches("Starred") ||
                    matches("Settings")) && (
                    <Collapsible
                      open={isHistoryOpen}
                      onOpenChange={setIsHistoryOpen}
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
                                <SidebarMenuSubButton
                                  className="cursor-pointer"
                                  onClick={() => router.push("/bio-agent")}
                                >
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
                {isClientReady && (
                    <>
                      <SidebarMenuItem>
                        <div className="px-2 pt-1 pb-0.5 text-[11px] text-sidebar-foreground/60">
                          Recent
                        </div>
                      </SidebarMenuItem>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.slice(0, 8).map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <div className="group/history-row flex items-center gap-1">
                              <SidebarMenuButton
                                className="cursor-pointer"
                                onClick={() => router.push(`/bio-agent?history=${item.id}`)}
                                title={item.title}
                              >
                                <HistoryIcon />
                                <span className="truncate">{item.title}</span>
                                <span className="ml-auto text-[10px] text-sidebar-foreground/60">
                                  {formatHistoryDate(item.updatedAt)}
                                </span>
                              </SidebarMenuButton>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 cursor-pointer opacity-0 transition-opacity group-hover/history-row:opacity-100 group-focus-within/history-row:opacity-100 focus-visible:opacity-100"
                                aria-label="대화 삭제"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeChatHistoryById(item.id);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </SidebarMenuItem>
                        ))
                      ) : (
                        <SidebarMenuItem>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/60">
                            저장된 대화가 없습니다.
                          </div>
                        </SidebarMenuItem>
                      )}
                      {chatHistory.length > 0 && (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            className="cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground"
                            onClick={() => clearChatHistory()}
                          >
                            <Trash2 />
                            <span>Clear history</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </>
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
