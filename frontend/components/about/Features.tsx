import {
  Video,
  Brain,
  Zap,
  FileText,
  Search,
  MessageSquare,
} from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";

type Feature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const features: Feature[] = [
  {
    title: "Video RAG Technology",
    description:
      "Advanced retrieval using CLIP, Whisper, and BLIP embeddings for frame, audio, and caption-based search.",
    icon: Video,
  },
  {
    title: "LLM Planning & Reasoning",
    description:
      "Local LLMs generate reasoning chains, plan actions, and adapt to single or multi-video conversations.",
    icon: Brain,
  },
  {
    title: "Real-time Streaming",
    description:
      "Live WebSocket chat with markdown rendering and response progress updates for instant feedback.",
    icon: Zap,
  },
  {
    title: "Multi-Video Support",
    description:
      "Search and reason across multiple videos in a single conversation for comprehensive analysis.",
    icon: Search,
  },
  {
    title: "File Attachments",
    description:
      "Upload PDFs, documents, and various file types for context-aware responses alongside video content.",
    icon: FileText,
  },
  {
    title: "Multimodal Awareness",
    description:
      "Full understanding of video transcripts, visual frames, and captions for comprehensive AI responses.",
    icon: MessageSquare,
  },
];

export function Features() {
  return (
    <section className="py-16 px-8 w-full overflow-x-hidden min-h-[50vh] h-full">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What is ChronoChat?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            ChronoChat is a UI for Ollama, with an additional feature of
            uploading videos and documents to the chat.
          </p>
        </div>

        <div className="flex justify-center items-center w-full flex-1">
          <ResizablePanelGroup
            direction="horizontal"
            className="max-w-4xl max-h-xl rounded-lg border w-full min-h-[500px]"
          >
            <ResizablePanel defaultSize={50}>
              <Card className="w-full h-full border-none shadow-none flex flex-col">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <img
                        src="/ollama.png"
                        alt="Ollama"
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">UI for Ollama</CardTitle>
                  <CardDescription>
                    ChronoChat provides a beautiful, modern interface for
                    interacting with your local Ollama models
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-start justify-center">
                  <div className="text-sm text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      • Clean and intuitive chat interface
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      • Real-time streaming responses
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      • Support for code blocks, markdown and latex
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={40} minSize={25}>
                  <Card className="w-full h-full border-none shadow-none flex flex-col">
                    <CardHeader className="text-center pb-2">
                      <div className="flex justify-center mb-2">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">
                        Video Input Support
                      </CardTitle>
                      <CardDescription>
                        Upload and analyze video content with advanced AI
                        understanding.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={60} minSize={35}>
                  <Card className="w-full h-full border-none shadow-none flex flex-col">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">
                        OCR & Chat History
                      </CardTitle>
                      <CardDescription>
                        Advanced document processing and conversation management
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                      <div className="text-sm text-center space-y-3">
                        <p className="text-gray-600 dark:text-gray-400">
                          • OCR for PDFs and images
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          • Persistent chat history
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </section>
  );
}
