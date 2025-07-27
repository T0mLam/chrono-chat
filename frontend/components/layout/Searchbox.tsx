import {
  Calculator,
  Calendar,
  CreditCard,
  Link,
  Settings,
  Smile,
  User,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  CommandDialog,
} from "@/components/ui/command";
import { listUploadedVideos, VideoDetails } from "@/services/media";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchAllChats } from "@/services/chat";

interface Chat {
  chat_id: number;
  chat_name: string;
}

interface SearchboxProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Searchbox({ open, setOpen }: SearchboxProps) {
  const [videos, setVideos] = useState<VideoDetails[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chat, videos] = await Promise.all([
          fetchAllChats(),
          listUploadedVideos(),
        ]);
        setChats(chat);
        setVideos(videos);
      } catch (error) {
        setChats([]);
        setVideos([]);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        { videos.length > 0 &&
        <CommandGroup heading="Media">
          {videos.map((video) => (
            <CommandItem
              key={video.filename}
              onSelect={() => {
                setOpen(false);
                router.push(`/upload?q=${video.filename}`);
              }}
            >
              <Image
                src={video.thumbnail_path}
                alt={video.filename}
                width={32}
                height={32}
                className="rounded-md mr-2"
              />
              <span>{video.filename}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        }
        { chats.length > 0 && videos.length > 0 && <CommandSeparator className="mb-1" />}
        { chats.length > 0 && 
          <CommandGroup heading="Chats">
            {chats.map((chat) => (
              <CommandItem
                key={chat.chat_id}
                className="py-1"
                onSelect={() => {
                setOpen(false);
                router.push(`/chat/${chat.chat_id}`);
              }}
            >
              <span>
                {chat.chat_name.length > 100
                  ? chat.chat_name.slice(0, 100) + "..."
                  : chat.chat_name}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        }
      </CommandList>
    </CommandDialog>
  );
}
