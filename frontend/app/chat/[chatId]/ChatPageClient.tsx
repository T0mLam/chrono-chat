"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import ChatContent from "@/components/chat/ChatContent";
import ChatBar from "@/components/chat/ChatBar";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { fetchChatMessages } from "@/services/chat";
interface ChatPageClientProps {
  chatId: number;
}

interface Message {
  type: string;
  content: string;
}

export default function ChatPageClient({ chatId }: ChatPageClientProps) {
  // Create a ref to attach to a dummy "anchor" div at the bottom
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [outputStateParams, setOutputStateParams] = useState<Record<string, string>>({});
  const pendingMarkdownRef = useRef<string>("");
  const pendingThinkingRef = useRef<string>("");
  const [username, setUsername] = useState<string>("");

  // Get username from localStorage after component mounts (client-side only)
  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  useEffect(() => {
    // When component mounts or `messages` changes, scroll into view
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, outputStateParams]); // re-run on messages change

  // Prioritize loading messages first (only for existing chats)
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const chatMessages = await fetchChatMessages(chatId);
        console.log("Chat messages:", chatMessages);
        setMessages(formatReceivedMessages(chatMessages));
      } catch (error) {
        console.error("Failed to load messages:", error);
        // If chat doesn't exist, treat it as a new chat
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadMessages();
  }, [chatId]);

  const formatReceivedMessages = (messages: any) => {
    return messages.map((message: any) => {
      if (message.role === "assistant") {
        return {
          type: "markdown",
          content: message.content,
        };
      } else if (message.role === "user") {
        return {
          type: "text",
          content: message.content,
        };
      } else if (message.role === "thinking") {
        return {
          type: "thinking",
          content: message.content,
        };
      }
    });
  };

  // When user sends a message
  const onSend = async (
    message: string,
    thinkingEnabled: boolean,
    model: string,
    videoNames: string[],
    videoMode: string,
    files: File[]
  ) => {
    setMessages((prev) => {
      pendingMarkdownRef.current = "";
      pendingThinkingRef.current = "";
      return [...prev, { type: "text", content: message }];
    });

    // Send message after updating UI
    await sendMessage(
      chatId,
      message,
      thinkingEnabled,
      model,
      videoNames,
      videoMode,
      files
    );
  };

  // Use the custom WebSocket hook to handle chat messages
  const handleWebSocketMessage = (data: any) => {
    console.log("Received WebSocket message:", data);

    setOutputStateParams(data.status ? data : {});

    if (data.type === "thinking") {
      // Handle thinking content
      if (pendingThinkingRef.current !== "") {
        pendingThinkingRef.current += data.content;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].type === "thinking") {
            updated[lastIndex] = {
              type: "thinking",
              content: pendingThinkingRef.current,
            };
          }
          return updated;
        });
      } else {
        pendingThinkingRef.current = data.content;
        setMessages((prev) => [
          ...prev,
          { type: "thinking", content: data.content },
        ]);
      }
    } else if (data.type === "markdown") {
      // Handle markdown content
      if (pendingMarkdownRef.current !== "") {
        pendingMarkdownRef.current += data.content;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].type === "markdown") {
            updated[lastIndex] = {
              type: "markdown",
              content: pendingMarkdownRef.current,
            };
          }
          return updated;
        });
      } else {
        pendingMarkdownRef.current = data.content;
        setMessages((prev) => [
          ...prev,
          { type: "markdown", content: data.content },
        ]);
      }
    }
  };

  // Only establish WebSocket connection for existing chats
  const { sendMessage, canSend, error, isConnecting } = useChatWebSocket(
    handleWebSocketMessage,
    !isLoadingMessages
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto flex flex-col">
        {messages.length > 0 ? (
          <ChatContent messages={messages} params={outputStateParams} />
        ) : (
          !isLoadingMessages && (
            <div className="flex-1 flex flex-col text-left items-center justify-center gap-2">
              <h1 className="text-3xl font-semibold text-indigo-950 bg-indigo-300 p-1">
                Hi {username || "there"}!
              </h1>
              <p className="text-sm text-gray-500">
                Send a message to start the chat.{" "}
                <span className="animate-pulse">↓</span>
              </p>
            </div>
          )
        )}
      </div>
      <div ref={bottomAnchorRef} />
      <ChatBar onSend={onSend} canSend={canSend && !isConnecting} />
    </div>
  );
}
