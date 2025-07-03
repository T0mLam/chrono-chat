"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Download,
  Loader2,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkYouTubeVideo, uploadYoutubeVideo } from "@/services/media";
import { toast } from "sonner";
import { Dialog, DialogClose } from "@/components/ui/dialog";

export function YouTubeSearch() {
  const [url, setUrl] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDownloadable, setIsDownloadable] = useState<boolean | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const extractVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSearch = async () => {
    const id = extractVideoId(url);
    if (!id) {
      toast.error("Invalid YouTube URL");
      return;
    }
    if (id === videoId) return; // Don't do anything if it's the same video

    setIsSearching(true);
    setVideoId(id);
    setIsDownloadable(null); // Reset downloadable status

    try {
      const result = await checkYouTubeVideo(url);
      setIsDownloadable(result.downloadable);
      setDownloadUrl(result.url);
    } catch (error) {
      toast.error("Error checking video");
      setIsDownloadable(false);
    }
  };

  const handleImport = async () => {
    try {
      await uploadYoutubeVideo(downloadUrl);
      toast.success("Video uploaded successfully");
    } catch (error) {
      toast.error("Error uploading video");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="e.g. https://www.youtube.com/watch?v=..."
          className="flex-1 placeholder:text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          variant="outline"
          className="rounded-full group cursor-pointer"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-black">Searching...</p>
            </>
          ) : (
            <>
              <Search className="h-4 w-4 group-hover:text-red-600" />
              <p className="text-black">Search</p>
            </>
          )}
        </Button>
      </div>

      {videoId && (
        <>
          <div className="my-6 aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsSearching(false)}
            />
          </div>

          {/* show download button if video is downloadable */}
          {isDownloadable === true && (
            <Alert className="text-green-700">
              <CheckCircle2Icon />
              <AlertTitle>Success! This video is downloadable.</AlertTitle>
              <AlertDescription>
                Press the button below to import the video to your library.
                <DialogClose asChild>
                  <Button
                    className="rounded-full group cursor-pointer mt-2"
                    onClick={handleImport}
                  >
                    <Download className="h-4 w-4" />
                    <p className="text-white">Import</p>
                  </Button>
                </DialogClose>
              </AlertDescription>
            </Alert>
          )}
          {isDownloadable === false && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Sorry! This video cannot be downloaded.</AlertTitle>
              <AlertDescription>
                Please try downloading another video.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
