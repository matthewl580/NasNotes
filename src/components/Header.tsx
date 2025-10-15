
"use client";

import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CombineNotesDialog } from "@/components/CombineNotesDialog";
import { AuthButton } from "@/components/AuthButton";
import { Bot, Combine, Search, Tag, X } from "lucide-react";
import React, { useMemo } from "react";
import { Input } from "./ui/input";
import { ModeToggle } from "./ModeToggle";

type HeaderProps = {
  notes: Note[];
  onNoteAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'position' | 'zIndex' | 'userId'>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
};

export function Header({ notes, onNoteAdd, searchQuery, setSearchQuery, activeTag, setActiveTag }: HeaderProps) {
  const [isCombineDialogOpen, setIsCombineDialogOpen] = React.useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[10001] flex flex-col items-start justify-between p-4 bg-background/80 backdrop-blur-sm border-b gap-4">
        <div className="flex items-center justify-between w-full">
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
            <ModeToggle />
            </div>
        </div>

        <div className="flex items-center gap-4 w-full">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search notes..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {activeTag && (
                    <Button variant="secondary" size="sm" onClick={() => setActiveTag(null)}>
                        <X className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                )}
                {allTags.map(tag => (
                    <Button 
                        key={tag} 
                        variant={activeTag === tag ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                        className="shrink-0"
                    >
                        <Tag className="mr-2 h-4 w-4" />
                        {tag}
                    </Button>
                ))}
            </div>
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
