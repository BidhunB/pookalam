import React, { useRef } from "react";
import { usePookalam, Shape, Symmetry } from "@/store/pookalamStore";
import { 
    rotatePoint, polygonPath, starPath, petalPath, ringPath, 
    marigoldPath, lotusPath, leafPath,
    CENTER, SIZE, clamp 
} from "@/lib/geometry";
import { motion, AnimatePresence } from "framer-motion";

// --- Shape Renderer ---
const ShapeView = ({ shape, isSelected, isGhost = false }: { shape: Shape; isSelected?: boolean; isGhost?: boolean }) => {
  const props = {
    fill: shape.texture ? `url(#tex-${shape.texture})` : shape.fill,
    // We can't easily scale pattern here without changing ID. 
    // For now, let's assume we handle density in pattern logic or just omit for MVP speed.
    // Actually, we can use patternTransform.
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    style: { 
        cursor: isGhost ? "default" : "move",
        pointerEvents: isGhost ? "none" as const : "auto" as const
    },
    "data-id": isGhost ? undefined : shape.id,
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: isGhost ? 0.5 : shape.visible ? 1 : 0.1, scale: 1 },
    exit: { opacity: 0, scale: 0 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transition: { type: "spring", stiffness: 300, damping: 25 } as any
  };

  let element = null;

  if (shape.type === "circle") {
    element = <motion.circle cx={shape.x} cy={shape.y} r={shape.size} {...props} />;
  } else if (shape.type === "square") {
      element = <motion.rect x={shape.x - shape.size} y={shape.y - shape.size} width={shape.size * 2} height={shape.size * 2} transform={`rotate(${shape.rotation || 0}, ${shape.x}, ${shape.y})`} {...props} />;
  } else if (shape.type === "polygon") {
    const pts = polygonPath(shape.x, shape.y, shape.size, shape.sides || 5, shape.rotation || 0);
    element = <motion.polygon points={pts} {...props} />;
  } else if (shape.type === "star") {
    const pts = starPath(shape.x, shape.y, shape.size, shape.sides || 5, shape.innerRatio, shape.rotation || 0);
    element = <motion.polygon points={pts} {...props} />;
  } else if (shape.type === "petal") {
    const d = petalPath(shape.x, shape.y, shape.size, shape.rotation || 0);
    element = <motion.path d={d} {...props} />;
  } else if (shape.type === "ring") {
    const rInner = shape.size * (shape.innerRatio || 0.8);
    const pts = ringPath(shape.x, shape.y, shape.size, rInner, shape.rotation || 0, 96);
    element = <motion.polygon points={pts} {...props} />;
  } else if (shape.type === "flower-1") {
    const d = marigoldPath(shape.x, shape.y, shape.size, shape.rotation || 0);
    element = <motion.path d={d} {...props} />;
  } else if (shape.type === "flower-2") {
    const d = lotusPath(shape.x, shape.y, shape.size, shape.rotation || 0);
    element = <motion.path d={d} {...props} />;
  } else if (shape.type === "leaf-1") {
     const d = leafPath(shape.x, shape.y, shape.size, shape.rotation || 0);
     element = <motion.path d={d} {...props} />;
  }

  return (
    <>
      {element}
      {isSelected && (
        <motion.circle 
            cx={shape.x} cy={shape.y} r={shape.size + 4} 
            fill="none" stroke="#3b82f6" strokeWidth="2" 
            strokeDasharray="4 2" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="no-export"
        />
      )}
    </>
  );
};

// --- Symmetry Wrapper ---
const SymmetricalShape = ({ shape, symmetry, isSelected }: { shape: Shape; symmetry: Symmetry; isSelected: boolean }) => {
  const nodes: React.ReactNode[] = [];
  
  // 1. Base Shape
  nodes.push(<ShapeView key={shape.id} shape={shape} isSelected={isSelected} />);

  // 2. Mirrors
  const variants: { x: number; y: number; r: number }[] = [];
  if (symmetry.mirrorX) variants.push({ x: SIZE - shape.x, y: shape.y, r: shape.rotation ? 360 - shape.rotation : 0 });
  if (symmetry.mirrorY) variants.push({ x: shape.x, y: SIZE - shape.y, r: shape.rotation ? 180 - shape.rotation : 0 });
  if (symmetry.mirrorX && symmetry.mirrorY) variants.push({ x: SIZE - shape.x, y: SIZE - shape.y, r: shape.rotation ? (shape.rotation + 180) % 360 : 0 });

  variants.forEach((v, i) => {
    const mirror = { ...shape, x: v.x, y: v.y, rotation: v.r };
    nodes.push(<ShapeView key={`${shape.id}-m${i}`} shape={mirror} isGhost />);
  });

  // 3. Radial
  const count = clamp(Math.floor(symmetry.radial), 1, 64);
  for (let i = 1; i < count; i++) {
     const a = (i * 360) / count;
     const p = rotatePoint(shape.x, shape.y, CENTER, CENTER, a);
     const rotated = { ...shape, x: p.x, y: p.y, rotation: (shape.rotation || 0) + a };
     nodes.push(<ShapeView key={`${shape.id}-r${i}`} shape={rotated} isGhost />);

     // Apply mirrors to radial clones
     variants.forEach((v, k) => {
        const mx = SIZE - p.x;
        const my = SIZE - p.y;
        // Logic for mirror of rotated point is complex, simplifying to basic geometric reflection of the NEW point (p)
        // If we mirrored the original, then rotated, we get one set. If we rotate then mirror, we get another.
        // Pookalam usually implies rotating the whole set.
        
        // Actually, easiest way is to just rotate the MIRRORS as well.
        // But the previous logic was explicit. Let's use mirror logic on p.
        const opts = [];
        if (symmetry.mirrorX) opts.push({ x: mx, y: p.y, r: rotated.rotation ? 360 - rotated.rotation : 0 });
        if (symmetry.mirrorY) opts.push({ x: p.x, y: my, r: rotated.rotation ? 180 - rotated.rotation : 0 });
        if (symmetry.mirrorX && symmetry.mirrorY) opts.push({ x: mx, y: my, r: rotated.rotation ? (rotated.rotation + 180) % 360 : 0 });

        opts.forEach((opt, j) => {
            const m = { ...shape, x: opt.x, y: opt.y, rotation: opt.r };
            nodes.push(<ShapeView key={`${shape.id}-rm${i}-${k}-${j}`} shape={m} isGhost />);
        });
     });
  }

  return <g>{nodes}</g>;
};

export default function Canvas() {
  const store = usePookalam();
  const { 
      shapes, selectShape, updateShape, addShape, 
      selectedIds, symmetry, tool, fill, stroke, strokeWidth, snap, grid,
      saveHistory
  } = store;
  
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Handle Export
  React.useEffect(() => {
    const handleExport = async () => {
        if (!svgRef.current) return;
        
        // 1. Clone the SVG to manipulate it without affecting the UI
        const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
        
        // 2. Remove UI elements (Grid, Guides, Selection)
        const uiElements = clone.querySelectorAll('.no-export');
        uiElements.forEach(el => el.remove());
        
        // 3. Convert Texture Images to Base64
        // Logic: Find <image> tags in defs, fetch href, convert to base64, replace href.
        const images = clone.querySelectorAll('image');
        for (const img of Array.from(images)) {
            const href = img.getAttribute('href');
            if (href && href.startsWith('/')) {
                try {
                    const response = await fetch(href);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    await new Promise((resolve) => {
                        reader.onloadend = () => {
                            img.setAttribute('href', reader.result as string);
                            resolve(null);
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.error("Failed to embed image:", href, e);
                }
            }
        }
        
        // 4. Serialize
        const svgData = new XMLSerializer().serializeToString(clone);
        
        // 5. Render to Canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const size = 1600; 
        
        canvas.width = size;
        canvas.height = size;
        
        // Add white background (optional, but good for PNG)
        if (ctx) {
            ctx.fillStyle = "#ffffff00"; // Transparent
            // ctx.fillRect(0, 0, size, size); // Uncomment for white background
        }

        const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            if (ctx) {
                ctx.drawImage(img, 0, 0, size, size);
                const pngUrl = canvas.toDataURL("image/png");
                
                // Download
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `pookalam-${Date.now()}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }
        };
        img.src = url;
    };

    window.addEventListener('pookalam-export-png', handleExport);
    return () => window.removeEventListener('pookalam-export-png', handleExport);
  }, []);

  const getCoords = (e: React.PointerEvent | React.MouseEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      if (snap) {
          return { x: Math.round(rawX / 10) * 10, y: Math.round(rawY / 10) * 10 };
      }
      return { x: rawX, y: rawY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const target = e.target as SVGElement;
      const id = target.getAttribute("data-id");
      const coords = getCoords(e);
      
      if (id) {
          // Select existing
          e.stopPropagation();
          const shape = shapes.find(s => s.id === id);
          if (!shape) return;
          
          if (!selectedIds.includes(id)) {
              selectShape(id, e.shiftKey || e.ctrlKey);
          }
          
          saveHistory(); // Save before drag starts
          dragRef.current = { id, startX: coords.x, startY: coords.y, origX: shape.x, origY: shape.y };
      } else {
          // Click on canvas -> Add new shape OR Deselect
          // If we are just clicking empty space, maybe deselect?
          // But if we want to add, we should just add.
          // Let's implement: Click to Add. Background click deselects only if not adding?
          // Actually, standard behavior: Click empty = Deselect. 
          // But we need a way to ADD. 
          // Let's say: If Tool is active, click adds. 
          // But tool is ALWAYS active in this app design (state.tool).
          // So Click = Add. 
          // To deselect, maybe a dedicated button or key, or click OUTSIDE canvas? 
          // Or user clicks on canvas to place.
          
          // Let's go with: Click adds a shape at location.
          const newShape = {
              type: tool,
              x: coords.x, 
              y: coords.y,
              size: 40,
              fill,
              texture: store.texture, // Use global texture if set
              stroke,
              strokeWidth,
              sides: (tool === "polygon" || tool === "star") ? 5 : undefined,
              innerRatio: (tool === "star" || tool === "ring") ? 0.5 : undefined,
              rotation: 0
          };
          addShape(newShape);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!dragRef.current) return;
      const coords = getCoords(e);
      const dx = coords.x - dragRef.current.startX;
      const dy = coords.y - dragRef.current.startY;
      
      updateShape(dragRef.current.id, {
          x: dragRef.current.origX + dx,
          y: dragRef.current.origY + dy
      });
  };

  const handleMouseUp = () => {
      dragRef.current = null;
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-slate-100/50">
        <div className="relative shadow-2xl rounded-full overflow-hidden border-8 border-white/40 ring-1 ring-black/5 aspect-square h-full max-h-[800px] bg-white">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <defs>
                   <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                   </pattern>
                   {/* Dynamically create patterns for textures used in shapes */}
                   {[...new Set(shapes.map(s => s.texture).filter(Boolean))].map(url => (
                       <pattern key={url} id={`tex-${url}`} patternUnits="userSpaceOnUse" width="100" height="100" patternTransform={`scale(${store.textureDensity || 1})`}>
                           <image href={url} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
                       </pattern>
                   ))}
                </defs>
                {grid && <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" className="no-export" />}

                {/* Symmetry Guides */}
                {store.showGuides && (
                    <g className="opacity-20 pointer-events-none no-export">
                        {Array.from({ length: symmetry.radial }).map((_, i) => (
                            <line 
                                key={i}
                                x1={CENTER} y1={CENTER}
                                x2={CENTER + 400 * Math.cos((i / symmetry.radial) * Math.PI * 2)}
                                y2={CENTER + 400 * Math.sin((i / symmetry.radial) * Math.PI * 2)}
                                stroke="#f59e0b" strokeWidth="1"
                                strokeDasharray="5 5"
                            />
                        ))}
                    </g>
                )}

                {/* Center Marker */}
                <circle cx={CENTER} cy={CENTER} r={3} fill="#10b981" className="no-export" />

                {/* Shapes */}
                <AnimatePresence>
                    {shapes.map(s => (
                        <SymmetricalShape 
                            key={s.id} 
                            shape={s} 
                            symmetry={symmetry} 
                            isSelected={selectedIds.includes(s.id)} 
                        />
                    ))}
                </AnimatePresence>

                {/* Onboarding Ghost Ring (if empty) */}
                {shapes.length === 0 && (
                    <circle cx={CENTER} cy={CENTER} r={100} fill="none" stroke="#fcd34d" strokeWidth="2" strokeDasharray="8 4" className="opacity-50 animate-pulse no-export" />
                )}
            </svg>
        </div>
    </div>
  );
}
