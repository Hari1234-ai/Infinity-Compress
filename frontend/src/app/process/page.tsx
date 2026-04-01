"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Image, FileBox, RefreshCw } from 'lucide-react';

const steps = [
  { id: 1, label: "Detecting file type...", icon: <FileBox /> },
  { id: 2, label: "Analyzing structure & optimal compression...", icon: <Settings /> },
  { id: 3, label: "Running core compression engine...", icon: <RefreshCw className="animate-spin" /> },
  { id: 4, label: "Finalizing output & metadata stripping...", icon: <Image /> },
];

export default function ProcessPage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Check if we have file data
    const data = sessionStorage.getItem('processedResult');
    if (!data) {
      router.push('/');
      return;
    }

    // Simulate progress and steps
    const stepDuration = 1200; // ms per step
    const totalSteps = steps.length;
    
    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 2;
      setProgress(Math.min(currentProg, 100));
      
      const expectedStep = Math.min(
        Math.floor((currentProg / 100) * totalSteps),
        totalSteps - 1
      );
      
      setCurrentStepIndex(expectedStep);
      
      if (currentProg >= 100) {
        clearInterval(interval);
        setTimeout(() => router.push('/result'), 500);
      }
    }, (stepDuration * totalSteps) / 50);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 w-full">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl glass-panel p-10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-glass-border">
          <motion.div 
            className="h-full bg-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
          />
        </div>

        <div className="w-24 h-24 mx-auto bg-brand-500/10 rounded-full flex items-center justify-center mb-8 border border-brand-500/30">
           {steps[currentStepIndex]?.icon}
        </div>
        
        <h2 className="text-3xl font-bold mb-2">Processing File</h2>
        <p className="text-brand-400 font-medium h-6">
           {steps[currentStepIndex]?.label}
        </p>
        
        <div className="mt-10 space-y-3 hidden sm:block">
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${idx === currentStepIndex ? 'bg-glass-bg border border-brand-500/20' : 'opacity-40'}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx <= currentStepIndex ? 'bg-brand-500 text-white' : 'bg-glass-border text-text-secondary'}`}>
                 {idx < currentStepIndex ? "✓" : step.id}
               </div>
               <span className="text-sm font-medium">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-glass-border text-xs text-text-secondary opacity-70">
          Engine utilizing advanced adaptive heuristics. Optimized for minimal perceptual quality loss.
        </div>
      </motion.div>
    </div>
  );
}
