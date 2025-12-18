import React from "react";
import { usePookalam, ShapeType } from "@/store/pookalamStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
    Circle, Square, Hexagon, Star, Ticket, Disc, 
    Undo2, Redo2, Grid3X3, Flower, Flower2, Leaf
} from "lucide-react";

export default function Toolbar() {
  const store = usePookalam();

  const ToolBtn = ({ id, icon: Icon, label }: { id: ShapeType; icon: React.ElementType; label: string }) => (
    <div className="group relative flex items-center">
        <Button 
            variant={store.tool === id ? "default" : "ghost"} 
            size="icon" 
            onClick={() => store.setTool(id)}
            className={`w-10 h-10 transition-all ${
                store.tool === id 
                ? "bg-amber-600 text-white shadow-lg shadow-amber-100 ring-2 ring-amber-100" 
                : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
            }`}
        >
            <Icon className="h-5 w-5" />
        </Button>
        {/* Tooltip */}
        <span className="absolute left-12 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {label}
        </span>
    </div>
  );

  return (
    <Card className="fixed left-4 top-24 w-16 flex flex-col items-center bg-white/95 backdrop-blur-md border-amber-100/50 shadow-xl rounded-2xl z-20 py-4 gap-6">
        
        {/* Nature */}
        <div className="flex flex-col gap-2 items-center">
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-lr' }}>Floral</span>
            <ToolBtn id="flower-1" icon={Flower} label="Marigold" />
            <ToolBtn id="flower-2" icon={Flower2} label="Lotus" />
            <ToolBtn id="leaf-1" icon={Leaf} label="Leaf" />
            <ToolBtn id="petal" icon={Ticket} label="Petal" />
        </div>

        <div className="w-8 h-px bg-slate-100" />

        {/* Basic */}
        <div className="flex flex-col gap-2 items-center">
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-lr' }}>Geom</span>
            <ToolBtn id="circle" icon={Circle} label="Circle" />
            <ToolBtn id="ring" icon={Disc} label="Ring" />
            <ToolBtn id="square" icon={Square} label="Square" />
            <ToolBtn id="star" icon={Star} label="Star" />
        </div>

    </Card>
  );
}
