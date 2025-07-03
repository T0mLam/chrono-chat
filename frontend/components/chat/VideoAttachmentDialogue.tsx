"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileVideo2, Plus, YoutubeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { TooltipToggle } from "./ChatBar";
import { listUploadedVideos, VideoDetails } from "@/services/media";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoAttachmentCard } from "./VideoAttachmentCard";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VideoAttachmentDialogueProps {
  selectedVideos: string[];
  setSelectedVideos: (videos: string[]) => void;
}

export function VideoAttachmentDialogue({
  selectedVideos,
  setSelectedVideos,
}: VideoAttachmentDialogueProps) {
  const [mediaData, setMediaData] = useState<VideoDetails[]>([]);

  useEffect(() => {
    const fetchMediaData = async () => {
      const videos = await listUploadedVideos();
      setMediaData(videos);

      const storedSelectedVideos = localStorage.getItem("selectedVideos");
      if (storedSelectedVideos) {
        const parsedVideos = JSON.parse(storedSelectedVideos);
        // Filter out videos that no longer exist
        const validVideos = parsedVideos.filter((videoFilename: string) =>
          videos.some(
            (video) => video.filename === videoFilename && video.is_processed
          )
        );

        // Update localStorage if any invalid videos were removed
        if (validVideos.length !== parsedVideos.length) {
          localStorage.setItem("selectedVideos", JSON.stringify(validVideos));
        }

        setSelectedVideos(validVideos);
      }
    };
    fetchMediaData();
  }, []);

  const handleToggleVideo = (filename: string, isSelected: boolean) => {
    setSelectedVideos((prev) => {
      let newSelectedVideos = [...prev];

      if (isSelected && newSelectedVideos.length < 3) {
        newSelectedVideos.push(filename);
      } else if (!isSelected) {
        newSelectedVideos = prev.filter((video) => video !== filename);
      }
      localStorage.setItem("selectedVideos", JSON.stringify(newSelectedVideos));
      return newSelectedVideos;
    });
  };

  return (
    <div className="flex gap-4 relative">
      <Dialog>
        <DialogTrigger asChild>
          <TooltipToggle tooltip="Attach video embeddings">
            <FileVideo2 className="size-4" />
            <span className="text-xs absolute bottom-0 -right-[5px] rounded-full px-2 py-1">
              {selectedVideos.length > 0 ? selectedVideos.length : ""}
            </span>
          </TooltipToggle>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl mx-auto">
          <DialogHeader>
            <DialogTitle>Your videos</DialogTitle>
            <DialogDescription>
              Check the boxes to attach video embeddings to the current chat.
              (max: 3 videos)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 overflow-y-auto overflow-x-hidden">
            {mediaData
              .filter((video) => video.is_processed)
              .map((video) => (
                <VideoAttachmentCard
                  item={video}
                  key={video.filename}
                  isSelected={selectedVideos.includes(video.filename)}
                  onToggleChange={handleToggleVideo}
                />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
