import React from "react";
import { usePookalam } from "@/store/pookalamStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function PropertyPanel() {
  const { 
    selectedIds, shapes, updateSelectedShapes, removeSelected,
    fill, setFill, stroke, setStroke, strokeWidth, setStrokeWidth,
    symmetry, setSymmetry, snap, toggleSnap, grid, toggleGrid
  } = usePookalam();

  // If selection exists, show shape props. Else show global props (current tool settings/symmetry)
  // For simplicity, let's mix them or have tabs.
  // Actually, we usually want to change the "next" shape properties too.
  
  const hasSelection = selectedIds.length > 0;
  
  // Helper to get value from selection or global state
  // If multiple selected, we take the first one's value or defaults
  const firstSelected = hasSelection ? shapes.find(s => s.id === selectedIds[0]) : null;

  const currentFill = hasSelection ? (firstSelected?.fill || fill) : fill;
  const currentStroke = hasSelection ? (firstSelected?.stroke || stroke) : stroke;
  const currentSize = hasSelection ? (firstSelected?.size || 40) : 40;
  const currentRotation = hasSelection ? (firstSelected?.rotation || 0) : 0;

  const handlePropChange = (key: string, val: string | number) => {
      if (hasSelection) {
          updateSelectedShapes({ [key]: val });
      } else {
          // Update global "next" state
          if (key === 'fill') setFill(val as string);
          if (key === 'stroke') setStroke(val as string);
          if (key === 'strokeWidth') setStrokeWidth(val as number);
          // Sizes/Rotation not stored globally in store currently, but we could.
          // For now, let's just stick to colors for global.
      }
  };

  return (
    <Card className="fixed right-4 top-4 bottom-4 w-72 bg-white/90 backdrop-blur-md border-slate-200/60 shadow-xl rounded-2xl z-20 overflow-y-auto">
        <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {hasSelection ? `${selectedIds.length} Selected` : "Settings"}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            
            {/* Color section */}
            <div className="space-y-3">
                <Label>Fill Color</Label>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full border border-slate-200 shrink-0 shadow-sm" style={{ background: currentFill }} />
                    <Input type="color" value={currentFill} onChange={(e) => handlePropChange('fill', e.target.value)} className="flex-1" />
                </div>
                
                {/* Textures */}
                <div className="space-y-2 pt-2">
                    <Label className="text-xs text-slate-500">Textures</Label>
                    <div className="flex gap-2">
                         {[
                            { name: 'Marigold', url: '/textures/marigold_texture_1766084484294.png', color: '#f97316' },
                            { name: 'Jasmine', url: '/textures/jasmine_texture_1766084500499.png', color: '#f1f5f9' },
                            { name: 'Leaf', url: '/textures/leaf_texture_1766084515115.png', color: '#22c55e' }
                         ].map((t) => (
                             <button 
                                key={t.name}
                                className="w-8 h-8 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform overflow-hidden relative"
                                onClick={() => {
                                    if (hasSelection) {
                                        updateSelectedShapes({ texture: t.url, fill: 'transparent' });
                                    } else {
                                        // Set global texture
                                        usePookalam.getState().setTexture(t.url);
                                    }
                                }}
                                title={t.name}
                             >
                                 <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
                             </button>
                         ))}
                         <button 
                            className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 hover:bg-slate-50"
                            onClick={() => {
                                 if (hasSelection) updateSelectedShapes({ texture: undefined });
                                 else usePookalam.getState().setTexture(undefined);
                            }}
                            title="No Texture"
                         >
                             ✕
                         </button>
                {/* Texture Density */}
                <div className="pt-2">
                     <div className="flex justify-between">
                        <Label className="text-xs text-slate-500">Texture Size</Label>
                        <span className="text-xs text-slate-400">{(usePookalam(s => s.textureDensity) || 1).toFixed(1)}x</span>
                     </div>
                     <Slider 
                        value={[usePookalam(s => s.textureDensity) || 1]} 
                        min={0.2} max={3} step={0.1} 
                        onValueChange={([v]) => usePookalam.getState().setTextureDensity(v)} 
                        className="py-2"
                     />
                </div>
            </div>
        </div>

        {/* Recent Colors */}
                <div className="flex gap-1.5 flex-wrap">
                    {usePookalam(s => s.recentColors)?.map((c, i) => (
                        <button 
                            key={i} 
                            className="w-6 h-6 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform" 
                            style={{ background: c }}
                            onClick={() => handlePropChange('fill', c)}
                            title={c}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <Label>Stroke Color</Label>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full border border-slate-200 shrink-0" style={{ background: currentStroke }} />
                    <Input type="color" value={currentStroke} onChange={(e) => handlePropChange('stroke', e.target.value)} className="flex-1" />
                </div>
            </div>
            
            <div className="space-y-3">
                 <Label>Stroke Width: {hasSelection ? firstSelected?.strokeWidth : strokeWidth}</Label>
                 <Slider 
                    value={[hasSelection ? (firstSelected?.strokeWidth || 0) : strokeWidth]} 
                    max={10} step={0.5} 
                    onValueChange={([v]) => handlePropChange('strokeWidth', v)} 
                 />
            </div>

            <div className="h-px bg-slate-200 my-2" />

            {/* Transform section (Only if selected) */}
            {hasSelection && (
                <>
                    <div className="space-y-3">
                        <Label>Size: {Math.round(currentSize)}</Label>
                        <Slider 
                            value={[currentSize]} min={5} max={400} step={1} 
                            onValueChange={([v]) => handlePropChange('size', v)} 
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Rotation: {Math.round(currentRotation)}°</Label>
                        <Slider 
                            value={[currentRotation]} min={0} max={360} step={1} 
                            onValueChange={([v]) => handlePropChange('rotation', v)} 
                        />
                    </div>
                    
                    {/* Specific props */}
                    {firstSelected?.type === 'star' || firstSelected?.type === 'polygon' ? (
                        <div className="space-y-3">
                            <Label>Sides: {firstSelected?.sides}</Label>
                            <Slider 
                                value={[firstSelected?.sides || 5]} min={3} max={20} step={1} 
                                onValueChange={([v]) => handlePropChange('sides', v)} 
                            />
                        </div>
                    ) : null}

                    <Button variant="destructive" className="w-full mt-4" onClick={removeSelected}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Shape
                    </Button>

                    <div className="h-px bg-slate-200 my-2" />
                </>
            )}

            {/* Symmetry moved to dedicated panel */}
            
            <div className="h-px bg-slate-200 my-2" />

             {/* Canvas Settings */}
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Snap to Grid</Label>
                    <Switch checked={snap} onCheckedChange={toggleSnap} />
                </div>
                <div className="flex items-center justify-between">
                    <Label>Show Grid</Label>
                    <Switch checked={grid} onCheckedChange={toggleGrid} />
                </div>
            </div>

        </CardContent>
    </Card>
  );
}
