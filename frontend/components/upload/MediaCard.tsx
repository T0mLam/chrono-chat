"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Trash } from "lucide-react";
import { DeleteAlert } from "./DeleteAlert";
import { Progress } from "@/components/ui/progress";

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

interface MediaCardProps {
  item: MediaItem;
  onDelete: (item: MediaItem) => void;
}

export function MediaCard({ item, onDelete }: MediaCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="border-none shadow-none cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-500 bg-transparent">
        <CardContent>
          <div className="relative">
            {/* show the video thumbnail */}
            <Image
              src={item.image}
              alt={item.title}
              width={300}
              height={200}
              className="rounded-lg w-full h-auto object-contain"
            />
            <span className="absolute bottom-2 right-2 bg-black/70 bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
              {item.duration}
            </span>
          </div>
        </CardContent>
        <CardHeader>
          <div className="flex flex-row items-start justify-between w-full">
            <div>
              {/* show the video title and time */}
              <CardTitle>{item.title}</CardTitle>
              <div className="h-1" />
              <CardDescription>{item.time}</CardDescription>
              {item.progress !== 100 && (
                <div className="flex flex-row items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {item.progress}%
                  </span>
                  <Progress value={item.progress} className="w-24" />
                </div>
              )}
            </div>
            <div className="ml-3 flex items-center">
              {/* show the processing status and delete button */}
              {item.isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full text-xs flex items-center gap-2 disabled:opacity-100"
                    disabled
                  >
                    <Loader2 className="animate-spin w-4 h-4" /> {item.status}
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs flex items-center gap-2 disabled:opacity-100"
                    disabled
                  >
                    <CheckCircle className="text-green-500 w-4 h-4" /> Processed
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full cursor-pointer text-xs ml-2 hover:text-red-500 hover:bg-red-100"
                    aria-label={`Delete ${item.title}`}
                    onClick={handleDelete}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <DeleteAlert
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={item.title}
      />
    </>
  );
}
