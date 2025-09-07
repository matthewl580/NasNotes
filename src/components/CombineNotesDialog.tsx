"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { combineNotes } from "@/ai/flows/combine-notes";
import type { Note } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface CombineNotesDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  notes: Note[];
  onNoteAdd: (note: Note) => void;
}

export function CombineNotesDialog({
  isOpen,
  setIsOpen,
  notes,
  onNoteAdd,
}: CombineNotesDialogProps) {
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSelectedNotes([]);
    }
  }, [isOpen]);

  const handleToggleNote = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.find((n) => n.id === note.id)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  const handleCombine = async () => {
    if (selectedNotes.length < 2) {
      toast({
        title: "Not enough notes",
        description: "Please select at least two notes to combine.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const notesToCombine = selectedNotes.map(({ title, content }) => ({
        title,
        content,
      }));
      const result = await combineNotes({ notes: notesToCombine });

      const newNote: Note = {
        id: new Date().toISOString(),
        title: "Combined Note",
        content: result.summary,
        color: "bg-yellow-100",
        position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 150 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        zIndex: 1000, // High z-index to appear on top
      };
      onNoteAdd(newNote);
      toast({
        title: "Notes Combined",
        description: "A new note has been created with the combined summary.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to combine notes:", error);
      toast({
        title: "Error",
        description: "Failed to combine notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Combine Notes</DialogTitle>
          <DialogDescription>
            Select the notes you want to combine into a new summary note.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full pr-4">
          <div className="grid gap-4 py-4">
            {notes.map((note) => (
              <div key={note.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`note-${note.id}`}
                  onCheckedChange={() => handleToggleNote(note)}
                  checked={selectedNotes.some((n) => n.id === note.id)}
                />
                <label
                  htmlFor={`note-${note.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {note.title || `Note ${note.id.substring(0, 4)}...`}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCombine} disabled={isLoading || selectedNotes.length < 2}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Combine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
