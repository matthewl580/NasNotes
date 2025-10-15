
"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Tag,
  X,
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
import { Badge } from "./ui/badge";

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Partial<Note> & { id: string }) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

const noteColors = [
  "bg-white",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
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
  const [tagInput, setTagInput] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startSize = useRef({ width: 0, height: 0 });
  const startPosition = useRef({ x: 0, y: 0 });

  const { toast } = useToast();

  const iconButtonClasses = "bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20";
  const iconColorClasses = note.color === 'bg-white' ? "text-black" : "text-white";
  const textColorClasses = note.color === 'bg-white' ? "text-black" : "text-white";
  const proseClasses = note.color === 'bg-white' ? "prose" : "prose prose-invert";

  useEffect(() => {
    setEditedTitle(note.title || "");
    setEditedContent(note.content);
  }, [note.title, note.content]);

  const handleSave = () => {
    onUpdate({
      id: note.id,
      title: editedTitle,
      content: editedContent,
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
  
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  }
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const newTags = [...(note.tags || []), tagInput.trim()];
      onUpdate({ id: note.id, tags: newTags });
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = (note.tags || []).filter(tag => tag !== tagToRemove);
    onUpdate({ id: note.id, tags: newTags });
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startSize.current = { width: cardRef.current?.offsetWidth || 0, height: cardRef.current?.offsetHeight || 0 };
    startPosition.current = { x: e.clientX, y: e.clientY };

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !cardRef.current) return;
    const dx = e.clientX - startPosition.current.x;
    const dy = e.clientY - startPosition.current.y;
    const newWidth = Math.max(200, startSize.current.width + dx);
    const newHeight = Math.max(150, startSize.current.height + dy);
    cardRef.current.style.width = `${newWidth}px`;
    cardRef.current.style.height = `${newHeight}px`;
  };

  const handleResizeMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
    if (cardRef.current) {
        onUpdate({
            id: note.id,
            width: cardRef.current.offsetWidth,
            height: cardRef.current.offsetHeight,
        });
    }
  };


  return (
    <>
      <Card
        ref={cardRef}
        onMouseDown={(e) => {
          onMouseDown(e);
          onSelect(note.id);
        }}
        className={cn(
          "w-80 absolute transform transition-shadow duration-150 ease-in-out shadow-lg hover:shadow-2xl flex flex-col",
          note.color
        )}
        style={{
          left: `${note.position.x}px`,
          top: `${note.position.y}px`,
          zIndex: note.zIndex,
          width: note.width ? `${note.width}px` : '320px',
          height: note.height ? `${note.height}px` : 'auto',
          minHeight: '200px',
          minWidth: '220px',
        }}
      >
        <CardHeader className="relative pb-2">
          <div className="absolute top-2 left-2 cursor-move drag-handle p-2 -m-2">
            <GripVertical className={cn("text-muted-foreground", iconColorClasses)} />
          </div>
          <div className="flex justify-between items-start gap-2 ml-4">
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Note Title"
                className={cn("text-lg font-bold", textColorClasses, "placeholder:text-gray-300")}
              />
            ) : (
              <CardTitle className={cn("pt-1", textColorClasses)}>{note.title || "Note"}</CardTitle>
            )}
            <div className="flex items-center space-x-1 shrink-0">
              {isEditing ? (
                <Button variant="ghost" size="icon" onClick={handleSave} className={iconButtonClasses}>
                  <Save className={cn("h-4 w-4", iconColorClasses)} />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className={iconButtonClasses}>
                  <Edit className={cn("h-4 w-4", iconColorClasses)} />
                </Button>
              )}
            </div>
          </div>
          <CardDescription className={cn("ml-4", textColorClasses, "opacity-80")}>
            {new Date(note.updatedAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              className={cn("w-full h-full", textColorClasses)}
            />
          ) : (
            <div className={proseClasses}>
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
        <CardFooter className="flex flex-col items-start gap-2 pt-2">
            <div className="flex flex-wrap gap-2">
                {(note.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary">
                        {tag}
                        <button onClick={(e) => {e.stopPropagation(); removeTag(tag)}} className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-background/50">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <div className="relative w-full">
                <Tag className={cn("absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground", iconColorClasses)} />
                <Input 
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add a tag..."
                    className="pl-8 h-8 text-xs"
                />
            </div>
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={iconButtonClasses}>
                    <Palette className={cn("h-4 w-4", iconColorClasses)} />
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
              <Button variant="ghost" size="icon" onClick={handleAddImage} className={iconButtonClasses}>
                <ImageIcon className={cn("h-4 w-4", iconColorClasses)} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDrawingOpen(true)} className={iconButtonClasses}>
                <PenSquare className={cn("h-4 w-4", iconColorClasses)} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSummarize}
                disabled={isSummarizing}
                className={iconButtonClasses}
              >
                {isSummarizing ? (
                  <Loader2 className={cn("h-4 w-4 animate-spin", iconColorClasses)} />
                ) : (
                  <Sparkles className={cn("h-4 w-4", iconColorClasses)} />
                )}
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("text-destructive hover:text-destructive", iconButtonClasses)}
                >
                  <Trash2 className={cn("h-4 w-4", iconColorClasses)} />
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
          </div>
        </CardFooter>
        <div 
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" 
          onMouseDown={handleResizeMouseDown}
        />
      </Card>
      {isDrawingOpen && <DrawingCanvas
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onSave={handleSaveDrawing}
        existingDrawing={note.drawingUrl}
      />}
    </>
  );
}

    