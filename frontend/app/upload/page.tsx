"use client";

import { UploadDialog } from "@/components/upload/UploadDialog";
import { MediaCard } from "@/components/upload/MediaCard";
import { useState, useEffect } from "react";
import {
  deleteVideo,
  listUploadedVideos,
  VideoDetails,
} from "@/services/media";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDuration } from "@/lib/utils";

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

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mediaData, setMediaData] = useState<MediaGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // Initialize search term from URL params
  useEffect(() => {
    const searchQuery = searchParams.get("q") || "";
    setSearchTerm(searchQuery);
  }, [searchParams]);

  // Update URL params when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    // Update URL without causing a page reload
    router.replace(`/upload?${params.toString()}`, { scroll: false });
  };

  // Filter media data based on search term
  const filteredMediaData = mediaData
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups

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

      {/* Search Input */}
      <div className="w-full max-w-5xl mt-10 mb-4 flex justify-center items-center">
        <div className="w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search media files..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 border-none max-w-sm rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-4">
        {/* Show no results message if search returns empty */}
        {searchTerm && filteredMediaData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>No media files found matching "{searchTerm}"</p>
          </div>
        )}

        {/* show the filtered media data in a card grouped by date */}
        {filteredMediaData.map((group) => (
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
