import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip } from "lucide-react";
import { useRef } from "react";

export function FileUploadComponent({
  selectedFiles,
  setSelectedFiles,
}: {
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="ml-2">
            <Toggle onClick={handleToggleClick} pressed={false}>
              <Paperclip className="size-4" />
            </Toggle>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              max={3 - selectedFiles.length}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-white text-black border border-gray-200"
          arrowClassName="bg-white fill-white border-b border-r border-gray-200"
        >
          <div className="flex flex-col">
            <div className="text-sm font-semibold">Attach files</div>
            <div className="text-xs text-gray-500">
              You can attach up to 3 files
            </div>
            <div className="text-xs text-gray-500">
              Supported formats: Images, PDFs
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
