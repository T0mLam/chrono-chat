import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThinkingContent({ content }: { content: string }) {
  return (
    <Collapsible defaultOpen className="m-0">
      <div className="flex items-center justify-between gap-4 w-full mb-2">
        <h4 className="font-semibold text-gray-700 text-sm">
          Thought...
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="text-gray-500 text-xs border border-border rounded-md p-2">
        {content}
      </CollapsibleContent>
    </Collapsible>
  );
}
