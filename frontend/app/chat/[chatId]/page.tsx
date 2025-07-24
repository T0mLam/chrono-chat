import { redirect } from "next/navigation";
import ChatPageClient from "./ChatPageClient";
import { createNewChat } from "@/services/chat";

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  if (chatId === "-1") {
    const newChatId = await createNewChat();
    redirect(`/chat/${newChatId}`);
  }
  return <ChatPageClient chatId={Number(chatId)} />;
}
