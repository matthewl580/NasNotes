export type Note = {
  id: string;
  title?: string;
  content: string;
  group?: string;
  color: string;
  position: { x: number; y: number };
  imageUrl?: string;
  drawingUrl?: string;
  createdAt: string;
  updatedAt:string;
  zIndex: number;
  userId: string;
  tags?: string[];
  width?: number;
  height?: number;
};
