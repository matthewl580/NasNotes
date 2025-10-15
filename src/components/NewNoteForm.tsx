
"use client";

import React, { useState } from "react";
import type { Note } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface NewNoteFormProps {
  onAdd: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt" | "position" | "zIndex" | "userId">
  ) => void;
  defaultPosition: { x: number; y: number };
}

export function NewNoteForm({ onAdd, defaultPosition }: NewNoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === "") return;
    onAdd({
      title,
      content,
      color: "bg-white",
    });
    setTitle("");
    setContent("");
  };

  return (
    <div
      className="fixed"
      style={{
        left: `${defaultPosition.x}px`,
        top: `${defaultPosition.y}px`,
        zIndex: 1,
      }}
    >
      <Card className="w-80 shadow-lg bg-background border-2 border-dashed">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create a New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Take a note..."
              required
              rows={4}
            />
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
