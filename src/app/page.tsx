"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedNoteRef =
    useRef<{ id: string; offset: { x: number; y: number } } | null>(null);

  const { user, loading } = useAuth();
  const { toast } = useToast();

  const getLocalNotes = useCallback((): Note[] => {
    const localNotes = localStorage.getItem("notes");
    return localNotes ? JSON.parse(localNotes) : [];
  }, []);

  const saveLocalNotes = useCallback((notesToSave: Note[]) => {
    localStorage.setItem("notes", JSON.stringify(notesToSave));
  }, []);

  const migrateLocalNotesToFirestore = useCallback(async (userId: string) => {
    const localNotes = getLocalNotes();
    if (localNotes.length > 0) {
      const notesCollection = collection(firestore, "notes");
      const batch = writeBatch(firestore);
      let noteCount = 0;
  
      localNotes.forEach((note) => {
        // Don't migrate notes that might have been created offline but already have a firestore-like ID
        if (note.id.length < 10) { 
          const { id, ...noteData } = note;
          const newNoteRef = doc(notesCollection);
          batch.set(newNoteRef, { ...noteData, userId });
          noteCount++;
        }
      });
  
      if (noteCount > 0) {
        await batch.commit();
        toast({
          title: "Notes Migrated",
          description: `${noteCount} local notes have been saved to your account.`,
        });
      }
      localStorage.removeItem("notes");
    }
  }, [getLocalNotes, toast]);

  useEffect(() => {
    if (loading) return;

    if (user) {
      migrateLocalNotesToFirestore(user.uid);
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
      }, (error) => {
        console.error("Firestore snapshot error:", error);
        toast({
            title: "Error loading notes",
            description: "Could not load notes from the cloud.",
            variant: "destructive"
        })
      });

      return () => unsubscribe();
    } else {
      setNotes(getLocalNotes());
    }
  }, [user, loading, getLocalNotes, migrateLocalNotesToFirestore, toast]);

  const bringToFront = (id: string) => {
    if (user) {
        const noteRef = doc(firestore, "notes", id);
        const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex || 0));
        updateDoc(noteRef, { zIndex: maxZIndex + 1 });
    } else {
        const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex || 0));
        const updatedNotes = notes.map(note => note.id === id ? {...note, zIndex: maxZIndex + 1} : note);
        setNotes(updatedNotes);
        saveLocalNotes(updatedNotes);
    }
  };

  const addNote = async (
    newNoteData: Omit<
      Note,
      "id" | "createdAt" | "updatedAt" | "position" | "zIndex" | "userId"
    >
  ) => {

    const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex || 0));
    const newNote: Omit<Note, "id" | "userId"> = {
      ...newNoteData,
      position: { x: 200, y: 150 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      zIndex: maxZIndex + 2,
    };

    if (user) {
      await addDoc(collection(firestore, "notes"), { ...newNote, userId: user.uid });
    } else {
      const localNote: Note = {
          ...newNote,
          id: new Date().getTime().toString(),
          userId: 'local'
      }
      const updatedNotes = [...notes, localNote];
      setNotes(updatedNotes);
      saveLocalNotes(updatedNotes);
    }
  };

  const updateNote = async (updatedNote: Partial<Note> & { id: string }) => {
    if (user) {
        const { id, ...data } = updatedNote;
        const noteRef = doc(firestore, "notes", id);
        await updateDoc(noteRef, { ...data, updatedAt: new Date().toISOString() });
    } else {
        const updatedNotes = notes.map(note => note.id === updatedNote.id ? {...note, ...updatedNote, updatedAt: new Date().toISOString()} : note);
        setNotes(updatedNotes);
        saveLocalNotes(updatedNotes);
    }
  };

  const deleteNote = async (id: string) => {
    if (user) {
        const noteRef = doc(firestore, "notes", id);
        await deleteDoc(noteRef);
    } else {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        saveLocalNotes(updatedNotes);
    }
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

  if (loading) {
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
