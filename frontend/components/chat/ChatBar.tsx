"use client";

import { useEffect, useState } from "react";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@/components/ui/button";
import {
  CornerDownLeft,
  Loader2,
  Lightbulb,
  ListVideo,
  Sparkles,
  MessageSquareQuote,
  Ban,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { VideoAttachmentDialogue } from "./VideoAttachmentDialogue";
import { ModelComboBox } from "./ModelComboBox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SelectedVideoPreviews } from "./SelectedVideoPreviews";
import { DataStatePropInterceptor } from "./DataStatePropInterceptor";
import { FileUploadComponent } from "./FileUploadComponent";

interface ChatBarProps {
  onSend: (
    message: string,
    thinkingEnabled: boolean,
    model: string,
    videoNames: string[],
    videoMode: string,
    files: File[]
  ) => Promise<void>;
  canSend: boolean;
}

export function TooltipToggle({
  children,
  tooltip,
  disabled,
  ...props
}: { children: React.ReactNode; tooltip: string; disabled?: boolean } & React.ComponentProps<
  typeof Toggle
>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="ml-2">
            <Toggle {...props} disabled={disabled}>
              {children}
              <span className="sr-only">{tooltip}</span>
            </Toggle>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function VideoModeToggles({
  hidden,
  selectedVideoMode,
  selectedFiles,
  setSelectedVideoMode,
}: {
  hidden: boolean;
  selectedVideoMode: string;
  selectedFiles: File[];
  setSelectedVideoMode: (mode: string) => void;
}) {
  useEffect(() => {
    setSelectedVideoMode(selectedFiles.length > 0 ? "ignore" : "");
  }, [selectedFiles]);

  return (
    <ToggleGroup
      variant="outline"
      type="single"
      size="sm"
      className="bg-transparent shadow-none"
      hidden={hidden}
      value={selectedVideoMode}
      onValueChange={(value) => setSelectedVideoMode(value || "")}
      disabled={selectedFiles.length > 0}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DataStatePropInterceptor>
              <ToggleGroupItem
                value="summary"
                aria-label="Toggle summary"
                className="border-none"
              >
                <Sparkles className="h-2 w-2 text-gray-600" />
              </ToggleGroupItem>
            </DataStatePropInterceptor>
          </TooltipTrigger>
          <TooltipContent>Summary mode</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <DataStatePropInterceptor>
              <ToggleGroupItem
                value="query"
                aria-label="Toggle query"
                className="border-none"
              >
                <MessageSquareQuote className="h-2 w-2 text-gray-600" />
              </ToggleGroupItem>
            </DataStatePropInterceptor>
          </TooltipTrigger>
          <TooltipContent>Query mode</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <DataStatePropInterceptor>
              <ToggleGroupItem
                value="timestamps"
                aria-label="Toggle timestamps"
                className="border-none"
              >
                <ListVideo className="h-2 w-2 text-gray-600" />
              </ToggleGroupItem>
            </DataStatePropInterceptor>
          </TooltipTrigger>
          <TooltipContent>Timestamps mode</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <DataStatePropInterceptor>
              <ToggleGroupItem
                value="ignore"
                aria-label="Toggle ignore"
                className="border-none"
              >
                <Ban className="h-2 w-2 text-gray-600" />
              </ToggleGroupItem>
            </DataStatePropInterceptor>
          </TooltipTrigger>
          <TooltipContent>Ignore mode</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </ToggleGroup>
  );
}

export default function ChatBar({ onSend, canSend }: ChatBarProps) {
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [selectedVideoMode, setSelectedVideoMode] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modelCapabilities, setModelCapabilities] = useState<string[]>([]);

  useEffect(() => {
    if (!modelCapabilities.includes("thinking")) {
      setIsThinkingEnabled(false);
    }
  }, [modelCapabilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector("textarea") as HTMLTextAreaElement;
    const message = input.value.trim();

    if (message) {
      input.value = "";
      await onSend(
        message,
        isThinkingEnabled,
        selectedModel,
        selectedVideos,
        selectedVideoMode,
        selectedFiles
      );
    }
  };

  const handleKeyDownForSubmit = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const message = textarea.value.trim();
      if (message) {
        textarea.value = "";
        await onSend(
          message,
          isThinkingEnabled,
          selectedModel,
          selectedVideos,
          selectedVideoMode,
          selectedFiles
        );
      }
    }
  };

  return (
    <div className="sticky bottom-0 w-full max-w-4xl mx-auto p-4 z-20">
      <form
        onSubmit={handleSubmit}
        className="relative rounded-lg bg-background border border-border shadow-2xl focus-within:ring-1 focus-within:ring-ring overflow-hidden"
      >
        <div className="flex flex-col">
          <SelectedVideoPreviews
            selectedVideos={selectedVideos}
            setSelectedVideos={setSelectedVideos}
          />
          <ChatInput
            placeholder="Type your message here..."
            className="w-full min-h-14 resize-none rounded-lg border-0 p-3 shadow-none focus-visible:ring-0"
            onKeyDown={handleKeyDownForSubmit}
          />
        </div>
        <div className="flex items-center p-3 pt-0 bg-background">
          <FileUploadComponent
            allowImage={modelCapabilities.includes("vision")}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
          />

          <VideoAttachmentDialogue
            disabled={selectedFiles.length > 0}
            selectedVideos={selectedVideos}
            setSelectedVideos={setSelectedVideos}
          />

          <TooltipToggle
            tooltip="Enable thinking"
            pressed={isThinkingEnabled}
            onPressedChange={setIsThinkingEnabled}
            disabled={!modelCapabilities.includes("thinking")}
          >
            <Lightbulb className="size-4" />
          </TooltipToggle>

          <ModelComboBox
            modelCapabilities={modelCapabilities}
            setModelCapabilities={setModelCapabilities}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />

          <div className="flex items-center ml-auto gap-2">
            <VideoModeToggles
              hidden={selectedVideos.length === 0}
              selectedVideoMode={selectedVideoMode}
              selectedFiles={selectedFiles}
              setSelectedVideoMode={setSelectedVideoMode}
            />
            {/* Send button with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  type="submit"
                  disabled={!canSend || selectedModel === ""}
                >
                  {canSend && selectedModel !== "" ? (
                    <>
                      <span className="font-semibold">Send</span>
                      <CornerDownLeft className="size-3.5" />
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Loading...</span>
                      <Loader2 className="size-3.5 animate-spin" />
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-white text-xs flex items-center gap-1 whitespace-nowrap">
                  Press{" "}
                  <kbd className="ml-1 z-10 bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono font-medium opacity-100 select-none">
                    ⌘ Enter
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </form>
    </div>
  );
}
