import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  className?: string;
}

export default function ChatBubble({ message, className }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-10/12 justify-end my-15 ml-auto", className)}>
      <div className="flex flex-col items-end">
        <div className="bg-gray-100 rounded-lg px-4 py-3 shadow-md">
          <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        </div>
      </div>
    </div>
  );
}
