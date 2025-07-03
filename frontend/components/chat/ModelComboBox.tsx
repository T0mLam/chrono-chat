"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import axiosClient from "@/lib/axiosClient";
import { useEffect, useState } from "react";

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];

interface Model {
  name: string;
  size: number;
}

interface ModelComboBoxProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export function ModelComboBox({
  selectedModel,
  setSelectedModel,
}: ModelComboBoxProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    axiosClient.get("/chat/local_models").then((res: any) => {
      console.log("Loaded models:", res.data.models);
      setModels(res.data.models);
    });

    const storedModel = localStorage.getItem("selectedModel");
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  const setAndStoreSelectedModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("selectedModel", model);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between mx-2 border-none shadow-none bg-gray-50 hover:bg-gray-200"
        >
          {selectedModel
            ? models.find((model) => model.name === selectedModel)?.name
            : "Select model..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandInput placeholder="Search model..." className="h-9" />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.name}
                  value={model.name}
                  onSelect={(currentValue) => {
                    setAndStoreSelectedModel(currentValue);
                    setOpen(false);
                  }}
                >
                  {model.name}
                  <span className="text-xs text-gray-500">
                    {(model.size / (1024 ** 3)).toFixed(2)}GB
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedModel === model.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
