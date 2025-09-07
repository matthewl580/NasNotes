"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/types";
import { NoteCard } from "@/components/NoteCard";
import { NewNoteForm } from "@/components/NewNoteForm";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedNoteRef =
    useRef<{ id: string; offset: { x: number; y: number } } | null>(null);

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const notesCollection = collection(firestore, "notes");
    const q = query(notesCollection, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesData: Note[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({
          id: doc.id,
          ...data,
          position: data.position || { x: 100, y: 100 },
          zIndex: data.zIndex || 0,
        } as Note);
      });
      setNotes(notesData);
    });

    return () => unsubscribe();
  }, [user]);

  const bringToFront = (id: string) => {
    const noteRef = doc(firestore, "notes", id);
    const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex || 0));
    updateDoc(noteRef, { zIndex: maxZIndex + 1 });
  };

  const addNote = async (
    newNoteData: Omit<
      Note,
      "id" | "createdAt" | "updatedAt" | "position" | "zIndex" | "userId"
    >
  ) => {
    if (!user) return;

    const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex));
    const newNote: Omit<Note, "id"> = {
      ...newNoteData,
      userId: user.uid,
      position: { x: 200, y: 150 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      zIndex: maxZIndex + 2,
    };
    await addDoc(collection(firestore, "notes"), newNote);
  };

  const updateNote = async (updatedNote: Partial<Note> & { id: string }) => {
    const { id, ...data } = updatedNote;
    const noteRef = doc(firestore, "notes", id);
    await updateDoc(noteRef, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteNote = async (id: string) => {
    const noteRef = doc(firestore, "notes", id);
    await deleteDoc(noteRef);
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

    newX = Math.max(0, Math.min(newX, containerRect.width - 320));
    newY = Math.max(80, Math.min(newY, containerRect.height - 200));

    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === id ? { ...n, position: { x: newX, y: newY } } : n
      )
    );
  };

  const handleMouseUp = async () => {
    if (draggedNoteRef.current) {
      const { id } = draggedNoteRef.current;
      const note = notes.find((n) => n.id === id);
      if (note) {
        await updateNote({ id: note.id, position: note.position });
      }
    }
    draggedNoteRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
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
