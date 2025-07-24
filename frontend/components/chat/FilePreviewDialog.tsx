import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatBytes } from "@/components/ui/file-upload";

export function FilePreviewDialog({
  file,
  isOpen,
  onOpenChange,
}: {
  file: File;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="block truncate">{file.name}</DialogTitle>
          <DialogDescription className="block truncate">
            {new Date(file.lastModified).toLocaleString()} • {file.type} •{" "}
            {formatBytes(file.size)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onLoad={(e) =>
                URL.revokeObjectURL((e.target as HTMLImageElement).src)
              }
            />
          ) : file.type === "application/pdf" ? (
            <iframe
              src={URL.createObjectURL(file)}
              title={file.name}
              className="w-full h-full border-0"
              onLoad={(e) =>
                URL.revokeObjectURL((e.target as HTMLIFrameElement).src)
              }
            />
          ) : (
            <div className="text-center text-muted-foreground">
              No preview available for this file type.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
