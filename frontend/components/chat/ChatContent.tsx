"use client";

import { useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import MarkdownRenderer from "./MarkdownRenderer";
import ThinkingContent from "./ThinkingContent";

interface ChatContentProps {
  messages: { type: string, content: string }[];
}

export default function ChatContent({ messages }: ChatContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={containerRef}
      className="h-full w-full mx-auto overflow-hidden"
    >
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-y-auto">
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div key={index} className="w-full">
              {message.type === "text" ? (
                <ChatBubble message={message.content} />
              ) : message.type === "markdown" ? (
                <MarkdownRenderer content={message.content} />
              ) : (
                <ThinkingContent content={message.content} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 