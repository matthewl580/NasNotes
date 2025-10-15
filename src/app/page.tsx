
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

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
            tags: data.tags || [],
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
      setNotes(getLocalNotes().map(n => ({...n, tags: n.tags || []})));
    }
  }, [user, loading, getLocalNotes, migrateLocalNotesToFirestore, toast]);
  
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch =
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = activeTag ? note.tags?.includes(activeTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, activeTag]);

  const bringToFront = (id: string) => {
    const maxZIndex = Math.max(0, ...notes.map((n) => n.zIndex || 0));
    const newZIndex = maxZIndex + 1;
    
    const updatedNotes = notes.map(note => note.id === id ? {...note, zIndex: newZIndex} : note);
    setNotes(updatedNotes);

    if (user) {
        const noteToUpdate = notes.find(n => n.id === id);
        if (noteToUpdate) {
            const noteRef = doc(firestore, "notes", id);
            updateDoc(noteRef, { zIndex: newZIndex });
        }
    } else {
        saveLocalNotes(updatedNotes);
    }
  };

  const addNote = async (
    newNoteData: Omit<
      Note,
      "id" | "createdAt" | "updatedAt" | "position" | "zIndex" | "userId" | "tags"
    >
  ) => {

    const maxZIndex = Math.max(10001, ...notes.map((n) => n.zIndex || 0));
    const newNote: Omit<Note, "id" | "userId"> = {
      ...newNoteData,
      position: { x: 200, y: 200 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      zIndex: maxZIndex + 1,
      tags: [],
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
    const noteToUpdate = notes.find(n => n.id === updatedNote.id);
    if (!noteToUpdate) return;
  
    const dataToUpdate: Partial<Note> = {
      ...updatedNote,
      updatedAt: new Date().toISOString(),
    };
    
    // remove id from dataToUpdate to avoid sending it to firestore
    const { id, ...updateData } = dataToUpdate;

    const newNotes = notes.map((note) =>
        note.id === updatedNote.id ? { ...note, ...dataToUpdate } : note
      );
    setNotes(newNotes);
  
    if (user) {
      const noteRef = doc(firestore, "notes", id);
      await updateDoc(noteRef, updateData);
    } else {
      saveLocalNotes(newNotes);
    }
  };
  

  const deleteNote = async (id: string) => {
    const newNotes = notes.filter(note => note.id !== id);
    setNotes(newNotes);
    if (user) {
        const noteRef = doc(firestore, "notes", id);
        await deleteDoc(noteRef);
    } else {
        saveLocalNotes(newNotes);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || !target.closest(".drag-handle")) return;

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    bringToFront(id);

    const offset = {
      x: e.clientX - note.position.x,
      y: e.clientY - note.position.y,
    };
    draggedNoteRef.current = { id, offset };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedNoteRef.current || !containerRef.current) return;
    const { id, offset } = draggedNoteRef.current;

    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;

    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === id ? { ...n, position: { x: newX, y: newY } } : n
      )
    );
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (draggedNoteRef.current && containerRef.current) {
        const { id } = draggedNoteRef.current;
        const note = notes.find(n => n.id === id);
        if (note) {
            updateNote({ id: note.id, position: note.position });
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
      <Header 
        notes={notes} 
        onNoteAdd={addNote} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTag={activeTag}
        setActiveTag={setActiveTag}
      />
      <div className="relative w-full h-full pt-36">
        <NewNoteForm onAdd={addNote} defaultPosition={{ x: 40, y: 150 }} />
        {filteredNotes.map((note) => (
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
