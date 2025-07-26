import { Upload, Cpu, MessageCircle, Search, Zap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "../ui/card";

type Step = {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string;
  image?: string;
};

const steps: Step[] = [
  {
    number: 1,
    title: "Ingest Video",
    description:
      "Upload YouTube links or local videos to extract audio, frames, and captions.",
    icon: Upload,
    details: "Supports multiple formats and automatic content extraction",
  },
  {
    number: 2,
    title: "Embed Content",
    description:
      "AI computes multimodal embeddings and stores them in ChromaDB for fast retrieval.",
    icon: Cpu,
    details: "Uses CLIP, Whisper, and BLIP for comprehensive understanding",
  },
  {
    number: 3,
    title: "Chat Interaction",
    description:
      "Ask questions about your videos and let the LLM plan intelligent responses.",
    icon: MessageCircle,
    details: "Local LLMs provide reasoning chains and adaptive responses",
  },
  {
    number: 4,
    title: "RAG Retrieval",
    description:
      "Relevant video chunks are retrieved based on your query context and video content.",
    icon: Search,
    details: "Semantic search across transcripts, frames, and captions",
  },
  {
    number: 5,
    title: "Stream Response",
    description:
      "Get real-time AI responses with live updates and markdown formatting.",
    icon: Zap,
    details: "WebSocket streaming for instant, interactive conversations",
  },
];

export function HowItWorks() {
  return (
    <section className="pt-16 pb-2 px-8 h-full overflow-hidden">
      <div className="max-w-7xl mx-auto min-h-[80vh] flex flex-col">
        <div className="text-center mb-8 flex-shrink-0">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            How to use ChronoChat?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our advanced AI pipeline transforms video content into intelligent,
            searchable conversations using cutting-edge machine learning.
          </p>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col min-h-[400px]">
          <div className="flex-1 flex items-center justify-center px-12">
            <Carousel className="w-full">
              <CarouselContent>
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <CarouselItem key={index} className="md:basis-1/2">
                      <div className="p-1">
                        <Card className="h-full min-h-[250px]">
                          <CardContent className="flex flex-col items-center text-center p-6 h-full">
                            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
                              <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-semibold mb-4">
                              {step.number}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {step.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-2 flex-grow">
                              {step.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                              {step.details}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          <div className="flex justify-center items-center flex-shrink-0 mt-4">
            <p className="text-xs text-gray-500 opacity-80">
              Swipe left and right to see more
            </p>
          </div>
        </div>

        <div className="mt-8 text-center flex-shrink-0">
          <div className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-full">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              💡 Ideal for interviews, tutorials, and educational content
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
