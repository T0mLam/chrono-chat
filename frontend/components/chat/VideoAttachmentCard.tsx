"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoDetails } from "@/services/media";
import { formatDuration } from "@/lib/utils";
import { CircleCheck } from "lucide-react";

interface MediaCardProps {
  item: VideoDetails;
  isSelected: boolean;
  onToggleChange?: (filename: string, isSelected: boolean) => void;
}

export function VideoAttachmentCard({
  item,
  isSelected,
  onToggleChange,
}: MediaCardProps) {
  const handleCardClick = () => {
    if (onToggleChange) {
      onToggleChange(item.filename, !isSelected);
    }
  };

  return (
    <Card
      className={`border-none shadow-none cursor-pointer bg-transparent transition-all duration-200 hover:scale-105 ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
      }`}
      onClick={handleCardClick}
    >
      <CardContent>
        <div className="relative">
          {/* show the video thumbnail */}
          <Image
            src={item.thumbnail_path}
            alt={item.filename}
            width={300}
            height={200}
            className="rounded-lg w-full h-auto object-contain"
          />
          <span className="absolute bottom-2 right-2 bg-black/70 bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
            {formatDuration(item.duration)}
          </span>
          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
              <CircleCheck className="w-4 h-4" />
            </div>
          )}
        </div>
      </CardContent>
      <CardHeader>
        <div className="flex flex-row items-start justify-between w-full">
          <div>
            {/* show the video title and time */}
            <CardTitle className="text-sm line-clamp-1">
              {item.filename}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
