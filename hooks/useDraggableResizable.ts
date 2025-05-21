import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  top: number;
  left: number;
}

interface Size {
  width: number;
  height: number;
}

interface DraggableResizableOptions {
  initialPosition: Position;
  initialSize: Size;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  draggable?: boolean;
}

const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MIN_HEIGHT = 150;

export const useDraggableResizable = ({
  initialPosition,
  initialSize,
  minWidth = DEFAULT_MIN_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  resizable = true,
  draggable = true,
}: DraggableResizableOptions) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef<Position>(initialPosition);
  const initialSizeRef = useRef<Size>(initialSize);

  const handleMouseDownDrag = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position }; 
    e.preventDefault();
  }, [draggable, position]);

  const handleMouseDownResize = useCallback((e: React.MouseEvent) => {
    if (!resizable) return;
    setIsResizing(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialSizeRef.current = { ...size };
    e.preventDefault();
  }, [resizable, size]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && draggable) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        top: initialPosRef.current.top + dy,
        left: initialPosRef.current.left + dx,
      });
    }
    if (isResizing && resizable) {
      const dw = e.clientX - dragStartRef.current.x;
      const dh = e.clientY - dragStartRef.current.y;
      setSize({
        width: Math.max(minWidth, initialSizeRef.current.width + dw),
        height: Math.max(minHeight, initialSizeRef.current.height + dh),
      });
    }
  }, [isDragging, isResizing, draggable, resizable, minWidth, minHeight]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) setIsDragging(false);
    if (isResizing) setIsResizing(false);
  }, [isDragging, isResizing]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return {
    position,
    size,
    setPosition,
    setSize,
    handleMouseDownDrag,
    handleMouseDownResize,
    isDraggable: draggable,
    isResizable: resizable,
  };
}; 