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
import { getModelCapabilities } from "@/services/chat";

interface Model {
  name: string;
  size: number;
}

interface ModelComboBoxProps {
  className?: string;
  storageKey?: string;
  onModelChange?: (model: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelCapabilities: string[];
  setModelCapabilities: (capabilities: string[]) => void;
}

export function ModelComboBox({
  className,
  storageKey = "selectedModel",
  selectedModel,
  onModelChange,
  setSelectedModel,
  modelCapabilities,
  setModelCapabilities,
}: ModelComboBoxProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    axiosClient.get("/chat/local_models").then((res: any) => {
      console.log("Loaded models:", res.data.models);
      setModels(res.data.models);
    });

    const storedModel = localStorage.getItem(storageKey);
    if (storedModel) {
      setSelectedModel(storedModel);
      getModelCapabilities(storedModel).then((res: any) => {
        setModelCapabilities(res);
      });
    }
  }, []);

  useEffect(() => {
    if (onModelChange) {
      onModelChange(selectedModel);
    }
  }, [selectedModel, onModelChange]);

  const setAndStoreSelectedModel = (model: string) => {
    setSelectedModel(model);
    getModelCapabilities(model).then((res: any) => {
      setModelCapabilities(res);
    });
    localStorage.setItem(storageKey, model);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between mx-2 border-none shadow-none bg-gray-50 hover:bg-gray-200",
            className
          )}
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
                    {(model.size / 1000 ** 3).toFixed(2)}GB
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
