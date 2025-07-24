import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/chat/data-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { FilePreviewDialog } from "./FilePreviewDialog";

type FileDetails = {
  name: string;
  size: string;
  type: string;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1000));
  return `${(bytes / 1000 ** i).toFixed(i ? 1 : 0)} ${sizes[i]}`;
};

export function FileUploadDataTable({
  selectedFiles,
  setSelectedFiles,
}: {
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
}) {
  const [data, setData] = useState<FileDetails[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const columns: ColumnDef<FileDetails>[] = [
    {
      header: "Name",
      cell: ({ row }) => (
        <div>
          {row.original.name.slice(0, 20) +
            (row.original.name.length > 20 ? "..." : "")}
        </div>
      ),
      accessorKey: "name",
    },
    {
      header: "Size",
      accessorKey: "size",
    },
    {
      header: "Type",
      accessorKey: "type",
    },
    {
      id: "preview",
      enableHiding: false,
      cell: ({ row }) => {
        const file = row.original;
        const originalFile = selectedFiles.find((f) => f.name === file.name);
        return (
          <Button
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (originalFile) {
                setPreviewFile(originalFile);
                setIsPreviewOpen(true);
              }
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        );
      },
    },
    {
      id: "delete",
      enableHiding: false,
      cell: ({ row }) => {
        const file = row.original;
        const originalFile = selectedFiles.find((f) => f.name === file.name);
        return (
          <Button
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (originalFile) {
                setSelectedFiles(
                  selectedFiles.filter((f) => f !== originalFile)
                );
              }
            }}
          >
            <Trash2 className="text-red-500 h-3 w-3" />
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    const details = selectedFiles.map((file) => ({
      name: file.name,
      size: formatBytes(file.size),
      type: file.type.split("/")[1].toUpperCase(),
    }));
    setData(details);
  }, [selectedFiles]);

  return (
    <>
      <div className={cn("container mx-auto", data.length === 0 && "hidden")}>
        <DataTable columns={columns} data={data} />
      </div>
      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      )}
    </>
  );
}
