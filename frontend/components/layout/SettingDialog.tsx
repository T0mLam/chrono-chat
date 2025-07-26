"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Settings } from "lucide-react";
import { ModelComboBox } from "../chat/ModelComboBox";
import { updatePlannerModel } from "@/services/chat";

export function SettingDialog() {
  const [username, setUsername] = useState<string>("");
  const [selectedPlannerModel, setSelectedPlannerModel] = useState<string>("");

  // Load username from localStorage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Save username to localStorage when it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
    }
  }, [username]);

  // Load planner model from localStorage and set it on the backend when app launches
  useEffect(() => {
    const storedPlannerModel = localStorage.getItem("selectedPlannerModel");
    if (storedPlannerModel) {
      setSelectedPlannerModel(storedPlannerModel);
      // Call the backend to set the planner model
      updatePlannerModel(storedPlannerModel);
    }
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuItem key="settings">
          <SidebarMenuButton tooltip="Settings" className="cursor-pointer mb-2">
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="gap-1">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Auto-save is applied when you make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="username-1">Username</Label>
              <div className="text-xs text-gray-500 mt-1">
                Username displayed on the new chat page.
              </div>
            </div>
            <Input
              id="username-1"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <div>
              <Label htmlFor="model-1">Planner Model</Label>
              <div className="text-xs text-gray-500 mt-1">
                Model used for selecting retrieval modes, creating chat titles,
                summarizing the chat and refining queries for RAG. (Default:
                qwen3:0.6b)
              </div>
            </div>
            <ModelComboBox
              className="mx-0"
              storageKey="selectedPlannerModel"
              selectedModel={selectedPlannerModel}
              setSelectedModel={setSelectedPlannerModel}
              onModelChange={updatePlannerModel}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
