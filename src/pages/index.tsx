import Head from "next/head";
import Canvas from "@/components/pookalam/Canvas";
import Toolbar from "@/components/pookalam/Toolbar";
import PropertyPanel from "@/components/pookalam/PropertyPanel";
import TopBar from "@/components/pookalam/TopBar";
import SymmetryPanel from "@/components/pookalam/SymmetryPanel";
import OnboardingOverlay from "@/components/pookalam/OnboardingOverlay";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#FFFDF5] text-slate-800 font-sans selection:bg-amber-200 overflow-hidden">
      <Head>
        <title>Pookalam Designer Suite</title>
      </Head>

      <TopBar />
      <OnboardingOverlay />

      <main className="flex-1 relative">
        <Toolbar />
        <Canvas />
        <SymmetryPanel />
        <PropertyPanel />

      </main>
    </div>
  );
}
