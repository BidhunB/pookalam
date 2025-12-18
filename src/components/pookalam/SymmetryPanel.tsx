import React from "react";
import { usePookalam } from "@/store/pookalamStore";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Grid3X3, Copy } from "lucide-react";

export default function SymmetryPanel() {
  const { symmetry, setSymmetry, showGuides, toggleGuides } = usePookalam();

  return (
    <Card className="fixed right-4 top-20 w-72 bg-white/95 backdrop-blur-md border-amber-100/50 shadow-lg rounded-2xl z-20 p-5 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Copy className="h-4 w-4" />
            <h3 className="font-serif font-bold text-sm tracking-wide uppercase">Symmetry Magic</h3>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-slate-600">Petals / Copies</Label>
                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs">{symmetry.radial}</span>
                </div>
                <Slider 
                    value={[symmetry.radial]} min={1} max={32} step={1} 
                    onValueChange={([v]) => setSymmetry({ radial: v })}
                    className="cursor-pointer"
                />
            </div>

            <div className="flex items-center justify-between">
                <Label className="text-slate-600 text-sm">Mirror Vertical</Label>
                <Switch checked={symmetry.mirrorX} onCheckedChange={(v) => setSymmetry({ mirrorX: v })} />
            </div>
            
            <div className="flex items-center justify-between">
                <Label className="text-slate-600 text-sm">Mirror Horizontal</Label>
                <Switch checked={symmetry.mirrorY} onCheckedChange={(v) => setSymmetry({ mirrorY: v })} />
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Label className="text-slate-400 text-xs">Show Guides</Label>
                <Switch checked={showGuides} onCheckedChange={(v) => toggleGuides(v)} className="scale-75 origin-right" />
            </div>
        </div>
    </Card>
  );
}
