import React from "react";
import { usePookalam } from "@/store/pookalamStore";
import { Button } from "@/components/ui/button";
import { 
    Undo2, Redo2, Download, Save, Flower2, Share2 
} from "lucide-react";

export default function TopBar() {
  const { undo, redo } = usePookalam();

  const handleExport = () => {
    // Simple direct click on the hidden legacy button or dispatch custom event
    // Ideally we'd move the download logic to store or a util, but for now let's use a custom event or ref access.
    // Since Canvas is sibling, we'll dispatch an event.
    window.dispatchEvent(new CustomEvent('pookalam-export-png'));
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-amber-100/50 z-30 flex items-center justify-between px-6 shadow-sm">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center shadow-md text-white">
                <Flower2 className="h-5 w-5" />
            </div>
            <div>
                <h1 className="text-lg font-bold font-serif text-slate-800 tracking-tight leading-none">Pookalam</h1>
                <span className="text-[10px] text-amber-600 font-medium tracking-widest uppercase">Designer Suite</span>
            </div>
        </div>

        {/* Center Actions */}
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
            <Button variant="ghost" size="icon" onClick={undo} title="Undo">
                <Undo2 className="h-4 w-4 text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} title="Redo">
                <Redo2 className="h-4 w-4 text-slate-600" />
            </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex border-amber-200 text-amber-800 hover:bg-amber-50">
                <Save className="h-4 w-4 mr-2" />
                Save
            </Button>
            <Button size="sm" onClick={handleExport} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200/50">
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>
        </div>
    </div>
  );
}
