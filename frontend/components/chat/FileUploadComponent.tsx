import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { FileUploadDataTable } from "./FileUploadDataTable";

export function FileUploadComponent({
  selectedFiles,
  setSelectedFiles,
  allowImage,
}: {
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  allowImage: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles([...selectedFiles, ...newFiles].slice(0, 3));
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="ml-2 relative">
            <Toggle onClick={handleToggleClick} pressed={false}>
              <Paperclip className="size-4" />
              <span className="text-xs absolute bottom-0 -right-[5px] rounded-full px-2 py-1">
                {selectedFiles.length > 0 ? selectedFiles.length : ""}
              </span>
            </Toggle>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              max={3}
              onChange={handleFileSelect}
              className="hidden"
              accept={allowImage ? "image/*,.pdf" : ".pdf"}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-white text-black border border-gray-300 max-w-2xl flex flex-col gap-3 p-2"
          arrowClassName="bg-white fill-white border-b border-r border-gray-300"
        >
          <div className="flex flex-col">
            <div className="text-sm font-semibold">Attach files</div>
            <div className="text-xs text-gray-500">
              You can attach up to{" "}
              <span className="font-semibold text-black">3</span> files
            </div>
            <div className="text-xs text-gray-500">
              Supported formats: PDFs (text extraction), Images (for VLMs only)
            </div>
          </div>
          <FileUploadDataTable
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
