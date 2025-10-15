
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eraser, Pen } from "lucide-react";

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  existingDrawing?: string;
}

export function DrawingCanvas({
  isOpen,
  onClose,
  onSave,
  existingDrawing,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const colors = ["#000000", "#ef4444", "#22c55e", "#3b82f6", "#a855f7"];

  const getContext = () => canvasRef.current?.getContext("2d");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && isOpen) {
      const ctx = getContext();
      if (ctx) {
        // Set a white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (existingDrawing) {
          const img = new Image();
          img.src = existingDrawing;
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
        }
      }
    }
  }, [isOpen, existingDrawing]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getContext();
    if (ctx) {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = getContext();
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : "#ffffff";
      ctx.lineWidth = tool === "pen" ? 2 : 20;
      ctx.lineCap = "round";
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const ctx = getContext();
    if (ctx) {
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/png"));
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" style={{ zIndex: 10002 }}>
        <DialogHeader>
          <DialogTitle>Draw Something</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            width={550}
            height={400}
            className="rounded-lg border bg-white cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={tool === "pen" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setTool("pen")}
              >
                <Pen />
              </Button>
              <Button
                variant={tool === "eraser" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setTool("eraser")}
              >
                <Eraser />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all border-2 ${
                    color === c ? "ring-2 ring-offset-2 ring-primary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Drawing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    