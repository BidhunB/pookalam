import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Palette, Plus, Redo2, Undo2, Wand2, Grid, RefreshCcw, Sparkles, Trash2 } from "lucide-react";

// --- Types ---

type ShapeType = "circle" | "square" | "polygon" | "star" | "petal" | "ring";

interface Shape {
  id: string;
  type: ShapeType;
  x: number; // center x
  y: number; // center y
  size: number; // base size (radius or half-side)
  sides?: number; // for polygon/star
  innerRatio?: number; // star inner radius ratio
  rotation?: number; // degrees
  fill: string;
  stroke: string;
  strokeWidth: number;
}

interface Symmetry {
  radial: number; // number of repeats around center
  mirrorX: boolean; // vertical axis mirror
  mirrorY: boolean; // horizontal axis mirror
}

// --- Helpers ---

const uid = () => Math.random().toString(36).slice(2);

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const CENTER = 400; // SVG 800x800
const SIZE = 800;

const palettes: string[][] = [
  ["#f6bd60", "#f7ede2", "#f5cac3", "#84a59d", "#f28482"], // warm pastel
  ["#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff", "#8447ff"], // festive
  ["#ffb703", "#fb8500", "#8ecae6", "#219ebc", "#023047"], // Kerala-inspired sun/sea
  ["#e63946", "#f1faee", "#a8dadc", "#457b9d", "#1d3557"], // triadic cool
  ["#ffcf33", "#ff9f1c", "#ff4040", "#2ec4b6", "#011627"],
];

function rotatePoint(px: number, py: number, cx: number, cy: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const s = Math.sin(a);
  const c = Math.cos(a);
  const dx = px - cx;
  const dy = py - cy;
  const x = dx * c - dy * s + cx;
  const y = dx * s + dy * c + cy;
  return { x, y };
}

function polygonPath(cx: number, cy: number, radius: number, sides: number, rotation = 0) {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

function starPath(cx: number, cy: number, radius: number, sides: number, innerRatio = 0.5, rotation = 0) {
  const pts: string[] = [];
  const total = sides * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? radius : radius * innerRatio;
    const a = (i / total) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

function petalPath(cx: number, cy: number, size: number, rotation = 0) {
  // A simple lens-shaped petal using two arcs approximated by quadratic curves
  const w = size;
  const h = size * 1.6;
  const rx = w / 2;
  const ry = h / 2;
  const p1 = rotatePoint(cx, cy - ry, cx, cy, rotation);
  const p2 = rotatePoint(cx + rx, cy, cx, cy, rotation);
  const p3 = rotatePoint(cx, cy + ry, cx, cy, rotation);
  const p4 = rotatePoint(cx - rx, cy, cx, cy, rotation);
  // Use a closed path with smooth curves
  return `M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y} Q ${p4.x} ${p4.y} ${p1.x} ${p1.y} Z`;
}

function ringPath(cx: number, cy: number, rOuter: number, rInner: number, rotation = 0, segments = 64) {
  // Returns a donut-like polygon approximating a ring segment (full ring when segments divisible)
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const xo = cx + Math.cos(a) * rOuter;
    const yo = cy + Math.sin(a) * rOuter;
    outer.push(`${xo},${yo}`);
  }
  for (let i = segments - 1; i >= 0; i--) {
    const a = (i / segments) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const xi = cx + Math.cos(a) * rInner;
    const yi = cy + Math.sin(a) * rInner;
    inner.push(`${xi},${yi}`);
  }
  return [...outer, ...inner].join(" ");
}

// --- Component ---

export default function PookalamDesigner() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sym, setSym] = useState<Symmetry>({ radial: 8, mirrorX: false, mirrorY: false });
  const [tool, setTool] = useState<ShapeType>("petal");
  const [fill, setFill] = useState<string>("#ff9f1c");
  const [stroke, setStroke] = useState<string>("#111827");
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [size, setSize] = useState<number>(40);
  const [sides, setSides] = useState<number>(6);
  const [innerRatio, setInnerRatio] = useState<number>(0.5);
  const [rotation, setRotation] = useState<number>(0);
  const [snap, setSnap] = useState<boolean>(true);
  const [grid, setGrid] = useState<boolean>(true);

  const [history, setHistory] = useState<Shape[][]>([]);
  const [future, setFuture] = useState<Shape[][]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const pushHistory = (next: Shape[]) => {
    setHistory((h) => [...h.slice(-49), next]);
    setFuture([]);
  };

  const addShape = (s: Shape) => {
    const next = [...shapes, s];
    pushHistory(shapes);
    setShapes(next);
    setSelectedId(s.id);
  };

  const updateShape = (id: string, patch: Partial<Shape>) => {
    pushHistory(shapes);
    setShapes((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    pushHistory(shapes);
    setShapes((arr) => arr.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [shapes, ...f].slice(0, 50));
      setShapes(prev);
      setSelectedId(null);
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      setHistory((h) => [...h, shapes].slice(-50));
      setShapes(next);
      setSelectedId(null);
      return rest;
    });
  };

  // --- Auto Assist ---
  const suggestPalette = () => {
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    setFill(p[0]);
    setStroke(p[4]);
  };

  const autoRing = () => {
    const id0 = uid();
    const base: Shape = {
      id: id0,
      type: "ring",
      x: CENTER,
      y: CENTER,
      size: clamp(size, 10, 380),
      sides: 0,
      innerRatio: 0.8,
      rotation,
      fill,
      stroke,
      strokeWidth,
    };
    addShape(base);
  };

  const autoPetalBurst = () => {
    const count = sym.radial;
    const r = clamp(size * 3, 20, 360);
    const newOnes: Shape[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 360;
      const pos = rotatePoint(CENTER, CENTER - r, CENTER, CENTER, a);
      newOnes.push({
        id: uid(),
        type: "petal",
        x: pos.x,
        y: pos.y,
        size,
        rotation: a,
        fill,
        stroke,
        strokeWidth,
      });
    }
    pushHistory(shapes);
    setShapes((arr) => [...arr, ...newOnes]);
  };

  const randomMandala = () => {
    // Simple generator: interleave rings, polygons, and petals
    const steps = 6 + Math.floor(Math.random() * 5);
    const newShapes: Shape[] = [];
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    let r = 60;
    for (let i = 0; i < steps; i++) {
      const t = ["ring", "polygon", "star", "petal"][Math.floor(Math.random() * 4)] as ShapeType;
      const col = p[i % p.length];
      if (t === "ring") {
        newShapes.push({ id: uid(), type: "ring", x: CENTER, y: CENTER, size: r + 20, innerRatio: (r - 10) / (r + 20), rotation: 0, fill: col, stroke, strokeWidth });
        r += 30;
      } else if (t === "polygon") {
        newShapes.push({ id: uid(), type: "polygon", x: CENTER, y: CENTER, size: r, sides: 6, rotation: i * 10, fill: col, stroke, strokeWidth });
      } else if (t === "star") {
        newShapes.push({ id: uid(), type: "star", x: CENTER, y: CENTER, size: r, sides: 8, innerRatio: 0.5, rotation: i * 8, fill: col, stroke, strokeWidth });
      } else {
        const count = sym.radial;
        for (let k = 0; k < count; k++) {
          const a = (k / count) * 360;
          const pos = rotatePoint(CENTER, CENTER - r, CENTER, CENTER, a);
          newShapes.push({ id: uid(), type: "petal", x: pos.x, y: pos.y, size: 28, rotation: a, fill: col, stroke, strokeWidth });
        }
        r += 24;
      }
    }
    pushHistory(shapes);
    setShapes((arr) => [...arr, ...newShapes]);
    setFill(p[0]);
    setStroke(p[4]);
  };

  // --- Events ---
  const onCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    if (snap) {
      const step = 10;
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
    }
    const s: Shape = {
      id: uid(),
      type: tool,
      x,
      y,
      size,
      sides: tool === "polygon" || tool === "star" ? sides : undefined,
      innerRatio: tool === "star" || tool === "ring" ? innerRatio : tool === "ring" ? 0.8 : undefined,
      rotation,
      fill,
      stroke,
      strokeWidth,
    };
    addShape(s);
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const id = target.getAttribute("data-id");
    if (!id) return;
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = shapes.find((sh) => sh.id === id);
    if (!s) return;
    setSelectedId(id);
    dragging.current = { id, dx: x - s.x, dy: y - s.y };
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    let x = e.clientX - rect.left - dragging.current.dx;
    let y = e.clientY - rect.top - dragging.current.dy;
    if (snap) {
      const step = 10;
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
    }
    updateShape(dragging.current.id, { x, y });
  };

  const onMouseUp = () => {
    dragging.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        removeSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shapes, selectedId]);

  // --- Rendering helpers ---
  const renderShape = (s: Shape) => {
    const props = {
      fill: s.fill,
      stroke: s.stroke,
      strokeWidth: s.strokeWidth,
      "data-id": s.id,
      style: { cursor: "move" as const, pointerEvents: "auto" as const },
    };

    if (s.type === "circle") {
      return <circle cx={s.x} cy={s.y} r={s.size} {...props} />;
    }
    if (s.type === "square") {
      const half = s.size;
      const x = s.x - half;
      const y = s.y - half;
      return (
        <rect x={x} y={y} width={half * 2} height={half * 2} transform={`rotate(${s.rotation || 0}, ${s.x}, ${s.y})`} {...props} />
      );
    }
    if (s.type === "polygon") {
      const pts = polygonPath(s.x, s.y, s.size, s.sides || 6, s.rotation || 0);
      return <polygon points={pts} {...props} />;
    }
    if (s.type === "star") {
      const pts = starPath(s.x, s.y, s.size, s.sides || 8, s.innerRatio || 0.5, s.rotation || 0);
      return <polygon points={pts} {...props} />;
    }
    if (s.type === "petal") {
      const d = petalPath(s.x, s.y, s.size, s.rotation || 0);
      return <path d={d} {...props} />;
    }
    if (s.type === "ring") {
      const rOuter = s.size;
      const rInner = s.size * (s.innerRatio || 0.8);
      const pts = ringPath(s.x, s.y, rOuter, rInner, s.rotation || 0, 96);
      return <polygon points={pts} {...props} />;
    }
    return null;
  };

  const renderWithSymmetry = (s: Shape, idx: number) => {
    const nodes: React.ReactNode[] = [];

    const base = renderShape(s);
    nodes.push(base);

    // Mirrors around center axes
    const variants: { x: number; y: number; r: number }[] = [];
    if (sym.mirrorX) variants.push({ x: SIZE - s.x, y: s.y, r: s.rotation ? 360 - s.rotation : 0 });
    if (sym.mirrorY) variants.push({ x: s.x, y: SIZE - s.y, r: s.rotation ? 180 - s.rotation : 0 });
    if (sym.mirrorX && sym.mirrorY) variants.push({ x: SIZE - s.x, y: SIZE - s.y, r: s.rotation ? (s.rotation + 180) % 360 : 0 });

    variants.forEach((v, i) => {
      const mirror: Shape = { ...s, x: v.x, y: v.y, rotation: v.r };
      nodes.push(React.cloneElement(renderShape(mirror) as any, { key: `${s.id}-m${i}` }));
    });

    // Radial symmetry about center
    const count = clamp(Math.floor(sym.radial), 1, 64);
    for (let i = 1; i < count; i++) {
      const a = (i * 360) / count;
      const p = rotatePoint(s.x, s.y, CENTER, CENTER, a);
      const rotated: Shape = { ...s, x: p.x, y: p.y, rotation: (s.rotation || 0) + a };
      nodes.push(React.cloneElement(renderShape(rotated) as any, { key: `${s.id}-r${i}` }));

      // Apply mirrors to each radial clone as well
      variants.forEach((v, k) => {
        const mx = SIZE - p.x;
        const my = SIZE - p.y;
        const opts = [
          sym.mirrorX ? { x: mx, y: p.y, r: rotated.rotation ? 360 - rotated.rotation : 0 } : null,
          sym.mirrorY ? { x: p.x, y: my, r: rotated.rotation ? 180 - rotated.rotation : 0 } : null,
          sym.mirrorX && sym.mirrorY ? { x: mx, y: my, r: rotated.rotation ? (rotated.rotation + 180) % 360 : 0 } : null,
        ].filter(Boolean) as any[];
        opts.forEach((opt: any, j: number) => {
          const m: Shape = { ...s, x: opt.x, y: opt.y, rotation: opt.r };
          nodes.push(React.cloneElement(renderShape(m) as any, { key: `${s.id}-rm${i}-${k}-${j}` }));
        });
      });
    }

    return (
      <g key={`${s.id}-wrap`} className={selectedId === s.id ? "opacity-100" : "opacity-100"}>
        {nodes}
        {selectedId === s.id && (
          <circle cx={s.x} cy={s.y} r={s.size * 0.15 + 6} fill="none" stroke="#6366f1" strokeDasharray="4 2" />
        )}
      </g>
    );
  };

  // --- Export ---
  const downloadSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pookalam.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    await new Promise<void>((res) => {
      img.onload = () => res();
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      dl.download = "pookalam.png";
      dl.click();
      URL.revokeObjectURL(dl.href);
    }, "image/png");
  };

  // --- UI ---
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 text-slate-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-3 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Pookalam Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Label>Shape</Label>
                <Select value={tool} onValueChange={(v: any) => setTool(v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pick shape" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petal">Petal</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="ring">Ring</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Size</Label>
                <div className="px-2">
                  <Slider value={[size]} min={6} max={200} step={2} onValueChange={([v]) => setSize(v)} />
                </div>

                <Label>Rotation</Label>
                <div className="px-2">
                  <Slider value={[rotation]} min={0} max={359} step={1} onValueChange={([v]) => setRotation(v)} />
                </div>

                <Label>Sides (poly/star)</Label>
                <div className="px-2">
                  <Slider value={[sides]} min={3} max={16} step={1} onValueChange={([v]) => setSides(v)} />
                </div>

                <Label>Inner ratio (star/ring)</Label>
                <div className="px-2">
                  <Slider value={[innerRatio]} min={0.2} max={0.95} step={0.01} onValueChange={([v]) => setInnerRatio(v)} />
                </div>

                <Label>Fill</Label>
                <Input type="color" value={fill} onChange={(e) => setFill(e.target.value)} />

                <Label>Stroke</Label>
                <Input type="color" value={stroke} onChange={(e) => setStroke(e.target.value)} />

                <Label>Stroke width</Label>
                <div className="px-2"><Slider value={[strokeWidth]} min={0} max={10} step={0.5} onValueChange={([v]) => setStrokeWidth(v)} /></div>

                <Label>Snap to grid</Label>
                <div className="flex items-center justify-end"><Switch checked={snap} onCheckedChange={setSnap} /></div>

                <Label>Show grid</Label>
                <div className="flex items-center justify-end"><Switch checked={grid} onCheckedChange={setGrid} /></div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={suggestPalette}><Palette className="h-4 w-4 mr-1" /> Palette</Button>
                <Button variant="secondary" size="sm" onClick={autoRing}><Grid className="h-4 w-4 mr-1" /> Auto Ring</Button>
                <Button variant="secondary" size="sm" onClick={autoPetalBurst}><Sparkles className="h-4 w-4 mr-1" /> Petal Burst</Button>
                <Button variant="secondary" size="sm" onClick={randomMandala}><Wand2 className="h-4 w-4 mr-1" /> Random Mandala</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Symmetry & Reflections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label>Radial copies</Label>
                <div className="px-2">
                  <Slider value={[sym.radial]} min={1} max={64} step={1} onValueChange={([v]) => setSym((s) => ({ ...s, radial: v }))} />
                </div>
                <Label>Mirror vertical axis</Label>
                <div className="flex items-center justify-end"><Switch checked={sym.mirrorX} onCheckedChange={(v) => setSym((s) => ({ ...s, mirrorX: v }))} /></div>
                <Label>Mirror horizontal axis</Label>
                <div className="flex items-center justify-end"><Switch checked={sym.mirrorY} onCheckedChange={(v) => setSym((s) => ({ ...s, mirrorY: v }))} /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={undo} variant="outline" size="sm"><Undo2 className="h-4 w-4 mr-1" />Undo</Button>
              <Button onClick={redo} variant="outline" size="sm"><Redo2 className="h-4 w-4 mr-1" />Redo</Button>
              <Button onClick={downloadSVG} size="sm"><Download className="h-4 w-4 mr-1" />SVG</Button>
              <Button onClick={downloadPNG} size="sm" variant="secondary"><Download className="h-4 w-4 mr-1" />PNG</Button>
              <Button onClick={removeSelected} variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-9">
          <Card className="shadow-md">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2"><Plus className="h-5 w-5" /> Canvas — click to add, drag to move</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full">
                <svg
                  ref={svgRef}
                  onClick={onCanvasClick}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  viewBox={`0 0 ${SIZE} ${SIZE}`}
                  className="w-full h-full aspect-square bg-white rounded-2xl shadow-inner border"
                >
                  {/* background radial guide */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    </pattern>
                  </defs>
                  {grid && <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />}

                  {/* center mark */}
                  <circle cx={CENTER} cy={CENTER} r={3} fill="#10b981" />

                  {/* Render shapes with symmetry */}
                  {shapes.map((s, i) => renderWithSymmetry(s, i))}
                </svg>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="text-center text-xs text-slate-500 py-4">
        Tip: Use Ctrl/Cmd+Z to undo, Y to redo. Delete key removes selected. Happy Onam! 🌼
      </footer>
    </div>
  );
}
