import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Type, 
  Trash2, 
  Download,
  Minus,
  X,
  Undo2,
  MousePointer
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Tool = "select" | "pen" | "eraser" | "rectangle" | "circle" | "line" | "text";

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  tool: Tool;
  color: string;
  strokeWidth: number;
  points: Point[];
  text?: string;
}

interface WhiteboardProps {
  annotations: Annotation[];
  onAddAnnotation: (annotation: Omit<Annotation, "id">) => void;
  onClear: () => void;
  onUndo: () => void;
  onClose: () => void;
  className?: string;
}

const COLORS = [
  "#00d4aa", // aurora-teal
  "#9b8aff", // aurora-violet
  "#00c8ff", // aurora-cyan
  "#ff6b8a", // aurora-rose
  "#ffffff", // white
  "#ffcc00", // yellow
];

const STROKE_WIDTHS = [2, 4, 6, 8];

export function Whiteboard({
  annotations,
  onAddAnnotation,
  onClear,
  onUndo,
  onClose,
  className,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all saved annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (annotation.tool === "pen" && annotation.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        annotation.points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (annotation.tool === "eraser" && annotation.points.length > 0) {
        ctx.strokeStyle = "#0d0e12"; // background color
        ctx.lineWidth = annotation.strokeWidth * 3;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        annotation.points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (annotation.tool === "rectangle" && annotation.points.length >= 2) {
        const [start, end] = annotation.points;
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (annotation.tool === "circle" && annotation.points.length >= 2) {
        const [start, end] = annotation.points;
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (annotation.tool === "line" && annotation.points.length >= 2) {
        const [start, end] = annotation.points;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    });

    // Draw current annotation being created
    if (currentPoints.length > 0 && (tool === "pen" || tool === "eraser")) {
      ctx.strokeStyle = tool === "eraser" ? "#0d0e12" : color;
      ctx.lineWidth = tool === "eraser" ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Draw shape preview
    if (startPoint && currentPoints.length > 0) {
      const endPoint = currentPoints[currentPoints.length - 1];
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.setLineDash([5, 5]);

      if (tool === "rectangle") {
        ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }
  }, [annotations, currentPoints, startPoint, tool, color, strokeWidth]);

  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        drawAnnotations();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [drawAnnotations]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select") return;
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentPoints([pos]);
    if (["rectangle", "circle", "line"].includes(tool)) {
      setStartPoint(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === "select") return;
    const pos = getMousePos(e);
    setCurrentPoints((prev) => [...prev, pos]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length > 1 || startPoint) {
      let points = currentPoints;
      if (startPoint && currentPoints.length > 0) {
        points = [startPoint, currentPoints[currentPoints.length - 1]];
      }

      onAddAnnotation({
        tool,
        color,
        strokeWidth,
        points,
      });
    }

    setCurrentPoints([]);
    setStartPoint(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const ToolButton = ({ 
    toolType, 
    icon: Icon, 
    label 
  }: { 
    toolType: Tool; 
    icon: React.ComponentType<{ className?: string }>; 
    label: string 
  }) => (
    <Button
      variant={tool === toolType ? "aurora" : "ghost"}
      size="iconSm"
      onClick={() => setTool(toolType)}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-0">
        <div className="flex items-center gap-1">
          <ToolButton toolType="select" icon={MousePointer} label="Select" />
          <ToolButton toolType="pen" icon={Pencil} label="Pen" />
          <ToolButton toolType="eraser" icon={Eraser} label="Eraser" />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolButton toolType="line" icon={Minus} label="Line" />
          <ToolButton toolType="rectangle" icon={Square} label="Rectangle" />
          <ToolButton toolType="circle" icon={Circle} label="Circle" />
          <div className="w-px h-6 bg-border mx-1" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="iconSm" className="relative">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: color }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                      color === c ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Stroke Width */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="iconSm">
                <div
                  className="rounded-full bg-foreground"
                  style={{ width: strokeWidth * 2, height: strokeWidth * 2 }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="flex gap-3 items-center">
                {STROKE_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      strokeWidth === w ? "bg-surface-2" : "hover:bg-surface-1"
                    )}
                  >
                    <div
                      className="rounded-full bg-foreground"
                      style={{ width: w * 2, height: w * 2 }}
                    />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="iconSm" onClick={onUndo} title="Undo">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="iconSm" onClick={onClear} title="Clear all">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="iconSm" onClick={handleDownload} title="Download">
            <Download className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
