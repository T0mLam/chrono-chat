"use client";

import {
  Calendar,
  CircleArrowDown,
  Coffee,
  History,
  Home,
  Inbox,
  Library,
  MoreHorizontal,
  Pen,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupAction,
  SidebarMenuAction,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { deleteChat, fetchAllChats, updateChatName } from "@/services/chat";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Button } from "../ui/button";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Library",
    url: "/upload",
    icon: Library,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const support = {
  title: "Buy me a coffee",
  url: "coff.ee/tomlam",
  avatar: "buymeacoffee.png",
  icon: Coffee,
  details: "as a support to ChronoChat",
};

interface Chat {
  chat_id: number;
  chat_name: string;
}

export function AppSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const pathname = usePathname();
  const { toggleSidebar, open, isMobile } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "t" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !(
          (event.target as HTMLElement).tagName === "INPUT" ||
          (event.target as HTMLElement).tagName === "TEXTAREA" ||
          (event.target as HTMLElement).contentEditable === "true"
        )
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleSidebar]);

  // Get the selected chat based on current URL
  const selectedChat =
    chats.find((chat) => pathname === `/chat/${chat.chat_id}`) || null;

  useEffect(() => {
    // Initial fetch
    fetchAllChats().then((chats) => {
      setChats(chats);
      console.log(chats);
    });

    // Set up polling every 1 second
    const interval = setInterval(async () => {
      fetchAllChats().then((chats) => {
        setChats(chats);
      });
    }, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar className="z-50" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 mb-1"
            >
              <Link href="/">
                <CircleArrowDown className="!size-5" />
                <span className="text-base font-semibold">ChronoChat.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarHeader>

      {/* New Chat Button when sidebar is collapsed */}
      <SidebarContent>
        <SidebarGroup hidden={open || isMobile}>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New Chat">
                  <Link
                    href="/chat/-1"
                    className="bg-indigo-100 text-indigo-950"
                  >
                    <Plus />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* New Latest Chat Button when sidebar is expanded */}
        {chats.length > 0 && (
          <SidebarGroup hidden={open || isMobile}>
            <SidebarGroupContent className="-mt-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Latest Chat">
                    <Link
                      href={`/chat/${chats[0].chat_id}`}
                      className="bg-gray-300 text-gray-800"
                    >
                      <History />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Chats when sidebar is expanded */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupAction title="New Chat">
            <Link href="/chat/-1">
              <Plus className="w-4 h-4" />
              <span className="sr-only">Add Project</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.chat_id}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={`/chat/${chat.chat_id}`}
                      title={chat.chat_name}
                      className={`${
                        selectedChat?.chat_id === chat.chat_id
                          ? "bg-accent text-accent-foreground hover:bg-accent shadow-sm"
                          : ""
                      }`}
                    >
                      <span>{chat.chat_name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction
                        showOnHover
                        className={`${
                          selectedChat?.chat_id === chat.chat_id
                            ? "bg-accent text-accent-foreground hover:bg-accent"
                            : ""
                        }`}
                      >
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingChatId(chat.chat_id);
                          setNewTitle(chat.chat_name);
                        }}
                      >
                        <Pen />
                        <span>Edit title</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          const message = await deleteChat(chat.chat_id);
                          toast.success(message.message);
                          redirect("/chat/-1");
                        }}
                      >
                        <Trash2 className="text-red-500" />
                        <span className="text-red-500">Delete chat</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Edit Chat Dialog */}
      <Dialog
        open={editingChatId !== null}
        onOpenChange={() => setEditingChatId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit chat title</DialogTitle>
            <DialogDescription>
              Enter a new title for your chat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid">
            <div className="grid grid-cols-5 items-center gap-2">
              <Label className="w-fit">Title</Label>
              <Input
                maxLength={50}
                id="name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-4"
                placeholder="Enter chat title..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                onClick={async () => {
                  if (editingChatId && newTitle.trim()) {
                    try {
                      await updateChatName(editingChatId, newTitle.trim());
                      toast.success("Chat name updated successfully");
                      setEditingChatId(null);
                      setNewTitle("");
                    } catch (error) {
                      toast.error("Failed to update chat name");
                    }
                  }
                }}
                className="px-4 py-2 rounded-md cursor-pointer"
              >
                Save changes
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Sponsor Me</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a
                    href="https://buymeacoffee.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 shadow-md hover:bg-gray-100 rounded"
                  >
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={support.avatar} alt={support.title} />
                        <AvatarFallback className="rounded-lg">
                          <support.icon className="!size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {support.title}
                        </span>
                        <span className="truncate text-xs">
                          {support.details}
                        </span>
                      </div>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter> */}
    </Sidebar>
  );
}
