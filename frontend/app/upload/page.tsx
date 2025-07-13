"use client";

import { UploadDialog } from "@/components/upload/UploadDialog";
import { MediaCard } from "@/components/upload/MediaCard";
import { useState, useEffect } from "react";
import {
  deleteVideo,
  listUploadedVideos,
  VideoDetails,
} from "@/services/media";

// Helper function to format duration from seconds to MM:SS
export const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

interface MediaItem {
  title: string;
  time: string;
  image: string;
  duration: string;
  isProcessing: boolean;
  taskId?: string;
  progress?: number;
  status?: string;
}

interface MediaGroup {
  date: string;
  items: MediaItem[];
}

// Sample media data
const initialMediaData: MediaGroup[] = [
  {
    date: "Fri May 2",
    items: [
      {
        title: "Space X Mars Landing",
        time: "9:20pm",
        image: "https://picsum.photos/200/30",
        duration: "02:15",
        isProcessing: true,
        taskId: "task1",
        progress: 45,
      },
      {
        title: "龙飞船登陆火星",
        time: "9:18pm",
        image: "https://picsum.photos/200/30",
        duration: "01:45",
        isProcessing: false,
      },
    ],
  },
  {
    date: "Sat Apr 26",
    items: [
      {
        title: "Lego Hong Kong Set",
        time: "12:17am",
        image: "https://picsum.photos/200/30",
        duration: "03:20",
        isProcessing: false,
      },
    ],
  },
];

export default function UploadPage() {
  const [mediaData, setMediaData] = useState<MediaGroup[]>([]);
  const [attachments, setAttachments] = useState<VideoDetails[]>([]);

  const fetchAllMedia = async () => {
    try {
      const videos = await listUploadedVideos();
      // Group videos by date
      const groupedVideos = videos.reduce(
        (groups: { [key: string]: MediaItem[] }, video: VideoDetails) => {
          const date = new Date(video.upload_time).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          if (!groups[date]) {
            groups[date] = [];
          }

          groups[date].push({
            title: video.filename,
            time: new Date(video.upload_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            image: video.thumbnail_path || "https://picsum.photos/200/30",
            duration: formatDuration(video.duration),
            isProcessing: video.task_status !== "Processed",
            taskId: video.task_id,
            progress: video.task_progress || 0,
            status: video.task_status,
          });

          return groups;
        },
        {}
      );

      const mediaGroups: MediaGroup[] = Object.entries(groupedVideos).map(
        ([date, items]) => ({
          date,
          items,
        })
      );

      setMediaData(mediaGroups);
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  useEffect(() => {
    fetchAllMedia(); // Initial fetch on mount
  }, []);

  useEffect(() => {
    console.log("Setting up polling for task status updates");

    // Poll for status updates every 2 seconds
    const interval = setInterval(async () => {
      fetchAllMedia();
    }, 1500); // Poll every 1.5 seconds

    return () => {
      console.log("Cleaning up polling interval");
      clearInterval(interval);
    };
  }, []);

  const handleDelete = (itemToDelete: MediaItem) => {
    deleteVideo(itemToDelete.title);
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 w-full mt-10">
      <h1 className="text-3xl font-bold tracking-tight">My media</h1>
      <p className="text-muted-foreground text-md mb-4">
        Upload your video files here
      </p>
      <UploadDialog />

      <div className="w-full max-w-5xl mt-8">
        {/* show the media data in a card grouped by date */}
        {mediaData.map((group) => (
          <div key={group.date} className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{group.date}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* show the media data in a card for each item in the same date */}
              {group.items.map((item, idx) => (
                <MediaCard key={idx} item={item} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
