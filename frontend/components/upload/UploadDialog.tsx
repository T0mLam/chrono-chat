import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, YoutubeIcon } from "lucide-react";
import { FileUploader } from "./FileUpload";
import { YouTubeSearch } from "./YouTubeSearch";
import { useState } from "react";

export function UploadDialog() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleUploadComplete = () => setIsUploadDialogOpen(false);

  return (
    <div className="flex gap-4">
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="rounded-full cursor-pointer">
            <Plus className="mr-2 h-5 w-5" />
            Upload Media
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl mx-auto">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Drag and drop your video files here or click to browse.
            </DialogDescription>
          </DialogHeader>
          <FileUploader onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="lg"
            variant="link"
            className="rounded-full cursor-pointer text-red-600"
          >
            <YoutubeIcon className="text-black mr-2 h-5 w-5" />
            <p className="text-black">Search YouTube</p>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl mx-auto">
          <DialogHeader>
            <DialogTitle>Search YouTube</DialogTitle>
            <DialogDescription>
              Search and import videos from YouTube.
            </DialogDescription>
          </DialogHeader>
          <YouTubeSearch />
        </DialogContent>
      </Dialog>
    </div>
  );
}
