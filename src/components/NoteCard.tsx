"use client";

import React, { useState } from "react";
import type { Note } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Edit,
  Save,
  Palette,
  Image as ImageIcon,
  PenSquare,
  Sparkles,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { summarizeLongNote } from "@/ai/flows/summarize-long-notes";
import { DrawingCanvas } from "./DrawingCanvas";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Partial<Note> & { id: string }) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

const noteColors = [
  "bg-white",
  "bg-rose-100",
  "bg-amber-100",
  "bg-emerald-100",
  "bg-sky-100",
  "bg-violet-100",
];

export function NoteCard({
  note,
  onUpdate,
  onDelete,
  onSelect,
  onMouseDown,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note.title || "");
  const [editedContent, setEditedContent] = useState(note.content);
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const { toast } = useToast();

  const handleSave = () => {
    onUpdate({
      id: note.id,
      title: editedTitle,
      content: editedContent,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await summarizeLongNote({ noteContent: note.content });
      onUpdate({
        id: note.id,
        content: result.summary,
        updatedAt: new Date().toISOString(),
      });
      setEditedContent(result.summary);
      toast({
        title: "Note Summarized",
        description: "The note content has been updated with a summary.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to summarize note.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      onUpdate({ id: note.id, imageUrl: url });
    }
  };

  const handleSaveDrawing = (dataUrl: string) => {
    onUpdate({ id: note.id, drawingUrl: dataUrl });
  };

  return (
    <>
      <Card
        onMouseDown={onMouseDown}
        onClick={() => onSelect(note.id)}
        className={cn(
          "w-80 absolute transform transition-shadow duration-150 ease-in-out shadow-lg hover:shadow-2xl",
          note.color
        )}
        style={{
          left: `${note.position.x}px`,
          top: `${note.position.y}px`,
          zIndex: note.zIndex,
        }}
      >
        <CardHeader className="relative pb-2">
          <div className="absolute top-2 left-2 cursor-move drag-handle p-2 -m-2">
            <GripVertical className="text-muted-foreground" />
          </div>
          <div className="flex justify-between items-start gap-2 ml-4">
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Note Title"
                className="text-lg font-bold"
              />
            ) : (
              <CardTitle className="pt-1">{note.title || "Note"}</CardTitle>
            )}
            <div className="flex items-center space-x-1 shrink-0">
              {isEditing ? (
                <Button variant="ghost" size="icon" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="ml-4">
            {new Date(note.updatedAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              className="w-full"
            />
          ) : (
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            </div>
          )}
          {note.imageUrl && (
            <div className="mt-4">
              <Image
                src={note.imageUrl}
                alt={note.title || "Note image"}
                width={300}
                height={200}
                className="rounded-md object-cover"
                data-ai-hint="note image"
              />
            </div>
          )}
          {note.drawingUrl && (
            <div className="mt-4 bg-white rounded-md border">
              <Image
                src={note.drawingUrl}
                alt="User drawing"
                width={300}
                height={200}
                className="rounded-md"
                data-ai-hint="drawing sketch"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {noteColors.map((color) => (
                  <DropdownMenuItem
                    key={color}
                    onClick={() => onUpdate({ id: note.id, color })}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mr-2 ${color} border`}
                    />
                    <span>{color.split("-")[1] || "white"}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={handleAddImage}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDrawingOpen(true)}>
              <PenSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSummarize}
              disabled={isSummarizing}
            >
              {isSummarizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your note.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(note.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
      <DrawingCanvas
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onSave={handleSaveDrawing}
        existingDrawing={note.drawingUrl}
      />
    </>
  );
}
