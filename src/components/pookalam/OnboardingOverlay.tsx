import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePookalam } from "@/store/pookalamStore";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

export default function OnboardingOverlay() {
  const { onboardingSeen, completeOnboarding, shapes } = usePookalam();
  const [step, setStep] = useState(0);

  // Auto-dismiss if user interacts (adds a shape)
  useEffect(() => {
    if (shapes.length > 0 && !onboardingSeen) {
        completeOnboarding();
    }
  }, [shapes, onboardingSeen, completeOnboarding]);

  if (onboardingSeen) return null;

  const steps = [
    { title: "Welcome to Pookalam Designer", desc: "Let's create a beautiful festival floral carpet.", action: "Start Designing" },
    { title: "Choose a Shape", desc: "Pick a petal, flower, or geometric shape from the left.", action: "Next" },
    { title: "Click & Drag", desc: "Click on the canvas to place it. Drag to move.", action: "Next" },
    { title: "Symmetry Magic", desc: "Use the panel on the right to multiply your designs instantly.", action: "Got it!" },
  ];

  const handleNext = () => {
      if (step < steps.length - 1) setStep(step + 1);
      else completeOnboarding();
  };

  return (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            <motion.div 
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center space-y-6 border-t-4 border-amber-500"
            >
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-serif text-slate-900">{steps[step].title}</h2>
                    <p className="text-slate-600 leading-relaxed">{steps[step].desc}</p>
                </div>
                
                <div className="flex justify-center pt-2">
                    <Button onClick={handleNext} size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8">
                        {steps[step].action}
                        {step === steps.length - 1 ? <Check className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex justify-center gap-2 mt-4">
                    {steps.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-amber-500" : "bg-slate-200"}`} />
                    ))}
                </div>
                
                {step === 0 && (
                    <p className="text-xs text-slate-400 cursor-pointer hover:text-slate-600" onClick={completeOnboarding}>
                        Skip intro
                    </p>
                )}
            </motion.div>
        </motion.div>
    </AnimatePresence>
  );
}
