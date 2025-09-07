"use client";

import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CombineNotesDialog } from "@/components/CombineNotesDialog";
import { AuthButton } from "@/components/AuthButton";
import { Bot, Combine } from "lucide-react";
import React from "react";

type HeaderProps = {
  notes: Note[];
  onNoteAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'position' | 'zIndex' | 'userId'>) => void;
};

export function Header({ notes, onNoteAdd }: HeaderProps) {
  const [isCombineDialogOpen, setIsCombineDialogOpen] = React.useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <Bot className="text-primary" size={28} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nasnotes
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsCombineDialogOpen(true)} variant="outline">
            <Combine className="mr-2 h-4 w-4" />
            Combine Notes
          </Button>
          <AuthButton />
        </div>
      </header>
      <CombineNotesDialog
        isOpen={isCombineDialogOpen}
        setIsOpen={setIsCombineDialogOpen}
        notes={notes}
        onNoteAdd={onNoteAdd}
      />
    </>
  );
}
