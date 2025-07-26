import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQItem = {
  question: string;
  answer: string;
};

const items = [
  {
    question: "What is ChronoChat?",
    answer:
      "ChronoChat is a conversational AI platform that enables users to chat with video content. It supports both YouTube and local uploads and uses retrieval-augmented generation (RAG) to answer questions using video transcripts, frames, and captions, powered by local LLMs via Ollama.",
  },
  {
    question: "What types of videos work best with ChronoChat?",
    answer:
      "ChronoChat is ideal for interviews, tutorials, and educational content with spoken dialogue. It's not suited for animations or silent videos since it heavily relies on audio transcripts and meaningful visual content for analysis.",
  },
  {
    question: "How does the Video RAG technology work?",
    answer:
      "ChronoChat uses advanced embeddings from CLIP (for video frames), Whisper (for audio transcription), and BLIP (for captions) to create a comprehensive understanding of your video content. When you ask questions, it retrieves relevant segments based on visual, audio, and textual context.",
  },
  {
    question: "Can I upload multiple videos and chat about them together?",
    answer:
      "Yes! ChronoChat supports multi-video conversations, allowing you to search and reason across multiple videos in a single chat session for comprehensive analysis and cross-referencing. However, it may affects the performance of the chat and causes hallucinations.",
  },
  {
    question: "What file types can I upload besides videos?",
    answer:
      "In addition to YouTube links and local video uploads, ChronoChat supports uploading PDFs, documents, and images for context-aware responses. The platform is designed to be extensible for additional file types.",
  },
  {
    question: "Do I need an internet connection or API keys?",
    answer:
      "ChronoChat runs entirely on your local machine using Ollama for LLM inference. No internet connection is required for chat functionality once videos are processed, and no external API keys are needed.",
  },
  {
    question: "Is my data safe and private?",
    answer:
      "Yes, your data is completely safe and private. ChronoChat processes all videos, documents, and conversations locally on your machine. The current version of ChronoChat does not support web search so nothing is sent to external servers or cloud services, ensuring your content remains under your full control and never leaves your device.",
  },
];

export const FAQAccordion = () => (
  <section className="max-w-3xl mx-auto py-8 px-8 mb-12 w-full">
    <h2 className="text-3xl font-bold mb-6 text-start">FAQs</h2>
    <Accordion type="single" collapsible>
      {items.map((item, idx) => (
        <AccordionItem value={`item-${idx + 1}`} key={idx}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);
