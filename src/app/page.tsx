"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Note } from "@/lib/types";
import { NoteCard } from "@/components/NoteCard";
import { NewNoteForm } from "@/components/NewNoteForm";
import { Header } from "@/components/Header";

const initialNotes: Note[] = [
  {
    id: "1",
    title: "Welcome to Nasnotes!",
    content:
      "This is your first note. You can edit, delete, drag, and customize it. Try adding an image or a drawing!",
    color: "bg-amber-100",
    position: { x: 100, y: 200 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    zIndex: 1,
  },
  {
    id: "2",
    title: "Features",
    content:
      "- Draggable notes\n- Color customization\n- Image & Drawing embeds\n- AI Summarization & Combination",
    color: "bg-sky-100",
    position: { x: 500, y: 250 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    zIndex: 2,
  },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedNoteRef =
    useRef<{ id: string; offset: { x: number; y: number } } | null>(null);

  useEffect(() => {
    setIsClient(true);
    const savedNotes = localStorage.getItem("nasnotes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes(initialNotes);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("nasnotes", JSON.stringify(notes));
    }
  }, [notes, isClient]);

  const bringToFront = (id: string) => {
    setNotes((prevNotes) => {
      const maxZIndex = Math.max(0, ...prevNotes.map((n) => n.zIndex));
      return prevNotes.map((n) =>
        n.id === id ? { ...n, zIndex: maxZIndex + 1 } : n
      );
    });
  };

  const addNote = (
    newNoteData: Omit<
      Note,
      "id" | "createdAt" | "updatedAt" | "position" | "zIndex"
    >
  ) => {
    const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex));
    const newNote: Note = {
      ...newNoteData,
      id: new Date().toISOString(),
      position: { x: 200, y: 150 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      zIndex: maxZIndex + 2, // +2 to be above new note form
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (updatedNote: Partial<Note> & { id: string }) => {
    setNotes(
      notes.map((n) =>
        n.id === updatedNote.id
          ? { ...n, ...updatedNote, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".drag-handle")) return;

    const note = notes.find((n) => n.id === id);
    const cardElement = (e.currentTarget as HTMLElement).closest(
      'div[style*="left"]'
    );
    if (!note || !cardElement) return;

    bringToFront(id);

    const rect = cardElement.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    draggedNoteRef.current = { id, offset };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedNoteRef.current || !containerRef.current) return;
    const { id, offset } = draggedNoteRef.current;

    const containerRect = containerRef.current.getBoundingClientRect();

    let newX = e.clientX - offset.x - containerRect.left;
    let newY = e.clientY - offset.y - containerRect.top;

    // Constrain within viewport
    newX = Math.max(0, Math.min(newX, containerRect.width - 320)); // 320 is card width
    newY = Math.max(80, Math.min(newY, containerRect.height - 200)); // approx card height

    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === id ? { ...n, position: { x: newX, y: newY } } : n
      )
    );
  };

  const handleMouseUp = () => {
    draggedNoteRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <main
      ref={containerRef}
      className="h-screen w-screen overflow-hidden relative"
    >
      <Header notes={notes} onNoteAdd={addNote} />
      <div className="relative w-full h-full pt-20">
        <NewNoteForm onAdd={addNote} defaultPosition={{ x: 60, y: 40 }} />
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onSelect={bringToFront}
            onMouseDown={(e) => handleMouseDown(e, note.id)}
          />
        ))}
      </div>
    </main>
  );
}
