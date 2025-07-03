"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { VideoDetails, listUploadedVideos } from "@/services/media";
import { formatDuration } from "@/lib/utils";

interface SelectedVideoPreviewsProps {
  selectedVideos: string[];
  setSelectedVideos: (videos: string[]) => void;
}

export function SelectedVideoPreviews({
  selectedVideos,
  setSelectedVideos,
}: SelectedVideoPreviewsProps) {
  const [videoDetails, setVideoDetails] = useState<VideoDetails[]>([]);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (selectedVideos.length === 0) {
        setVideoDetails([]);
        return;
      }

      try {
        const allVideos = await listUploadedVideos();
        const selectedDetails = allVideos.filter((video) =>
          selectedVideos.includes(video.filename)
        );
        setVideoDetails(selectedDetails);
      } catch (error) {
        console.error("Error fetching video details:", error);
      }
    };

    fetchVideoDetails();
  }, [selectedVideos]);

  const handleRemoveVideo = (filename: string) => {
    setSelectedVideos(selectedVideos.filter((video) => video !== filename));
    localStorage.setItem("selectedVideos", JSON.stringify(selectedVideos.filter((video) => video !== filename)));
  };

  if (selectedVideos.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 mb-1 bg-muted/10">
      {videoDetails.map((video) => (
        <div key={video.filename} className="relative group flex-shrink-0">
          <button
              onClick={() => handleRemoveVideo(video.filename)}
              className="absolute z-1 -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          <div className="relative w-24 h-16 rounded-md overflow-hidden border border-border">
            <Image
              src={video.thumbnail_path}
              alt={video.filename}
              fill
              sizes="sm"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
              {formatDuration(video.duration)}
            </div>
          </div>
          <div className="absolute -bottom-4 left-0 right-0 text-[10px] text-muted-foreground truncate max-w-24">
            {video.filename}
          </div>
        </div>
      ))}
    </div>
  );
}
