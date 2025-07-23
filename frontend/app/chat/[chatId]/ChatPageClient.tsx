"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import ChatContent from "@/components/chat/ChatContent";
import ChatBar from "@/components/chat/ChatBar";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { fetchChatMessages, createNewChat } from "@/services/chat";

const sampleMessage = `# Welcome to ChronoChat! 🚀

  ## Features Overview
  
  ### Math Support
  Inline math: $E = mc^2$
  Block math:
  $$
  \\frac{d}{dx}(x^n) = nx^{n-1}
  $$
  
  ### Tables
  | Feature | Description | Status |
  |---------|-------------|--------|
  | Markdown | Rich text formatting | ✅ |
  | Tables | Data organization | ✅ |
  | Math | LaTeX equations | ✅ |
  
  ### Lists
  - **Unordered list**
    - Nested item 1
    - Nested item 2
  1. **Ordered list**
     1. First item
     2. Second item
  
  ### Code
  \`\`\`python
  def hello_world():
      print("Hello from ChronoChat! "Hello from ChronoChat! "Hello from ChronoChat! "Hello from ChronoChat!")
  \`\`\`
  
  ### Links & Images
  [Visit our documentation](https://docs.example.com)
  
  ---
  *Enjoy your chat experience!*`;

const sampleMessage2 = `\begin{problem}
What is the minimum number of steps to reach the top-right corner (0,0) from (0,0) in a grid, where each step can       
be right or up?  
\end{problem}

The 2D dynamic programming solution is as follows:

$$
\begin{array}{|c|c|}
\hline
i & j \\
\hline
0 & 0 \\
\hline
1 & 0 \\
\hline
2 & 0 \\
\hline
\end{array}
$$

$$
\begin{array}{c|c}
i & j \\
\hline
0 & 0 \\
\hline
1 & 0 \\
\hline
2 & 0 \\
\hline
\end{array}
$$

$$
\begin{array}{l}
dp[i][j] = \min(dp[i-1][j], dp[i][j-1]) + 1 \\
\hline
\end{array}
$$

$$
\boxed{dp[2][0]} = 2
$$

$$
\begin{matrix}
i & j \\
0 & 0 \\
1 & 0 \\
2 & 0
\end{matrix}
$$

$$
dp[i][j] = \min(dp[i-1][j], dp[i][j-1]) + 1
$$

$$
\begin{array}{c|c}
a & b \\ \hline
c & d
\end{array}
$$

$$
\boxed{dp[2][0]} = 2
$$

This problem is a classic 2D dynamic programming problem, where each cell's value depends on the minimum number of      
steps required to reach it.`;

const initialMessages = [
  { type: "text", content: "Welcome to chat " },
  { type: "markdown", content: sampleMessage },
  { type: "text", content: "Welcome to chat " },
  { type: "markdown", content: sampleMessage },
  { type: "text", content: "Welcome to chat " },
  { type: "markdown", content: sampleMessage },
  { type: "text", content: "Welcome to chat " },
  { type: "markdown", content: sampleMessage },
  { type: "text", content: "Welcome to chat " },
  {
    type: "thinking",
    content:
      "This is a sample thinking message. It contains a lot of text to test the thinking content component.",
  },
  { type: "markdown", content: sampleMessage2 },
];

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

  const handleAttachFile = (file: File) => {
    // TODO: Implement file attachment logic with the chatId
    console.log(`Attaching file to chat ${chatId}:`, file.name);
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
                Hi there!
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
      <ChatBar
        onSend={onSend}
        canSend={canSend && !isConnecting}
      />
    </div>
  );
}
