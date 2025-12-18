import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { uid } from 'uid'; // Note: we might need to install uid or use a simple helper
// Using simple helper for now since I didn't install 'uid'
const generateId = () => Math.random().toString(36).slice(2);

export type ShapeType = "circle" | "square" | "polygon" | "star" | "petal" | "ring" | "flower-1" | "flower-2" | "leaf-1";

export interface Shape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    size: number;
    sides?: number;
    innerRatio?: number;
    rotation?: number;
    fill: string;
    texture?: string; // URL to texture image
    textureDensity?: number;
    stroke: string;
    strokeWidth: number;
    visible: boolean;
    locked: boolean;
}

export interface Symmetry {
    radial: number;
    mirrorX: boolean;
    mirrorY: boolean;
}

// interface HistoryState {
//    past: Shape[][];
//    future: Shape[][];
// }

interface PookalamState {
    shapes: Shape[];
    selectedIds: string[];
    symmetry: Symmetry;
    recentColors: string[];

    // UI State
    onboardingSeen: boolean;
    showGuides: boolean;
    textureDensity: number; // 0.5 to 3.0

    // Tool Defaults
    tool: ShapeType;
    fill: string;
    texture?: string;
    stroke: string;
    strokeWidth: number;
    snap: boolean;
    grid: boolean;

    // Actions
    setTool: (tool: ShapeType) => void;
    setFill: (color: string) => void;
    setTexture: (url: string | undefined) => void;
    setTextureDensity: (density: number) => void;
    setStroke: (color: string) => void;
    setStrokeWidth: (width: number) => void;
    setSymmetry: (patch: Partial<Symmetry>) => void;
    toggleSnap: () => void;
    toggleGrid: () => void;
    toggleGuides: (show?: boolean) => void;
    completeOnboarding: () => void;
    addRecentColor: (color: string) => void;

    addShape: (shape: Omit<Shape, 'id' | 'visible' | 'locked'>) => void;
    updateShape: (id: string, patch: Partial<Shape>) => void;
    updateSelectedShapes: (patch: Partial<Shape>) => void;
    removeShape: (id: string) => void;
    removeSelected: () => void;
    selectShape: (id: string, multi: boolean) => void;
    deselectAll: () => void;

    // Layers
    reorderShape: (fromIndex: number, toIndex: number) => void;
    toggleVisibility: (id: string) => void;
    toggleLock: (id: string) => void;

    // History
    undo: () => void;
    redo: () => void;
    saveHistory: () => void;
    past: Shape[][];
    future: Shape[][];
}

export const usePookalam = create<PookalamState>((set, get) => ({
    shapes: [],
    selectedIds: [],
    symmetry: { radial: 8, mirrorX: false, mirrorY: false },
    recentColors: ["#ff9f1c", "#e71d36", "#2ec4b6", "#ffbf69", "#ffffff", "#000000"],

    onboardingSeen: false,
    showGuides: true,
    textureDensity: 1,

    tool: "petal",
    fill: "#ff9f1c",
    stroke: "#111827",
    strokeWidth: 1,
    snap: true,
    grid: true,

    past: [],
    future: [],

    setTool: (tool) => set({ tool }),
    setFill: (fill) => {
        const { recentColors, addRecentColor } = get();
        addRecentColor(fill);
        set({ fill, texture: undefined }); // Clear texture if color is set
    },
    setTexture: (texture) => set({ texture }), // No recent textures logic for now
    setTextureDensity: (d) => set({ textureDensity: d }),
    setStroke: (stroke) => set({ stroke }),
    setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
    setSymmetry: (patch) => set((state) => ({ symmetry: { ...state.symmetry, ...patch } })),
    toggleSnap: () => set((state) => ({ snap: !state.snap })),
    toggleGrid: () => set((state) => ({ grid: !state.grid })),
    toggleGuides: (show) => set((state) => ({ showGuides: show ?? !state.showGuides })),
    completeOnboarding: () => set({ onboardingSeen: true }),

    addRecentColor: (color) => set((state) => {
        // Add unique, limit to 6
        const distinct = state.recentColors.filter(c => c !== color);
        return { recentColors: [color, ...distinct].slice(0, 6) };
    }),

    saveHistory: () => {
        set((state) => {
            const newPast = [...state.past, state.shapes];
            if (newPast.length > 50) newPast.shift();
            return { past: newPast, future: [] };
        });
    },

    addShape: (shapeAttr) => {
        const { saveHistory } = get();
        saveHistory();
        const newShape: Shape = {
            ...shapeAttr,
            id: generateId(),
            visible: true,
            locked: false,
        };
        set((state) => ({ shapes: [...state.shapes, newShape], selectedIds: [newShape.id] }));
    },

    updateShape: (id, patch) => {
        // Note: Calling saveHistory on every drag might be too much, usually handled onDragStart/End.
        // For now we'll rely on the consuming component to call saveHistory before major changes if needed,
        // or just assume direct updates are fine (we might want a separate "commit" action).
        set((state) => ({
            shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
    },

    updateSelectedShapes: (patch) => {
        const { saveHistory, selectedIds } = get();
        // Only save history if we are changing properties, not just dragging (which might call this often)
        // But for a simple impl, let's just save. Optimally we'd throttle or separate "transient" updates.
        saveHistory();
        set((state) => ({
            shapes: state.shapes.map((s) => selectedIds.includes(s.id) ? { ...s, ...patch } : s),
        }));
    },

    removeShape: (id) => {
        const { saveHistory } = get();
        saveHistory();
        set((state) => ({
            shapes: state.shapes.filter(s => s.id !== id),
            selectedIds: state.selectedIds.filter(sid => sid !== id)
        }));
    },

    removeSelected: () => {
        const { saveHistory, selectedIds } = get();
        if (selectedIds.length === 0) return;
        saveHistory();
        set((state) => ({
            shapes: state.shapes.filter(s => !selectedIds.includes(s.id)),
            selectedIds: []
        }));
    },

    selectShape: (id, multi) => set((state) => ({
        selectedIds: multi
            ? (state.selectedIds.includes(id)
                ? state.selectedIds.filter(sid => sid !== id)
                : [...state.selectedIds, id])
            : [id]
    })),

    deselectAll: () => set({ selectedIds: [] }),

    reorderShape: (from, to) => {
        // Simple array move
        const { saveHistory, shapes } = get();
        saveHistory();
        const newShapes = [...shapes];
        const [moved] = newShapes.splice(from, 1);
        newShapes.splice(to, 0, moved);
        set({ shapes: newShapes });
    },

    toggleVisibility: (id) => set((state) => ({
        shapes: state.shapes.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    })),

    toggleLock: (id) => set((state) => ({
        shapes: state.shapes.map(s => s.id === id ? { ...s, locked: !s.locked } : s)
    })),

    undo: () => set((state) => {
        if (state.past.length === 0) return {};
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        return {
            shapes: previous,
            past: newPast,
            future: [state.shapes, ...state.future],
            selectedIds: []
        };
    }),

    redo: () => set((state) => {
        if (state.future.length === 0) return {};
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
            shapes: next,
            past: [...state.past, state.shapes],
            future: newFuture,
            selectedIds: []
        };
    }),
}));
