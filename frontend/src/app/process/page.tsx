"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Files, RefreshCw, Zap, PackageCheck } from 'lucide-react';
import { getPendingFile, clearPendingFile } from '@/lib/fileStore';

const steps = [
  { id: 1, label: "Waking up compression engine...", icon: <Zap className="text-yellow-400" /> },
  { id: 2, label: "Uploading files to cloud...", icon: <Files /> },
  { id: 3, label: "Analyzing & optimizing each file...", icon: <Settings /> },
  { id: 4, label: "Running compression engine...", icon: <RefreshCw className="animate-spin text-brand-500" /> },
  { id: 5, label: "Packing into ZIP archive...", icon: <PackageCheck className="text-green-400" /> },
];

export default function ProcessPage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fileLabel, setFileLabel] = useState("your files");

  useEffect(() => {
    const { files, mode, targetFormat, targetSizeKb } = getPendingFile();

    if (!files || files.length === 0) {
      router.push('/');
      return;
    }

    setFileLabel(files.length === 1 ? files[0].name : `${files.length} files`);

    const processFiles = async () => {
      try {
        setCurrentStepIndex(0);
        setProgress(10);

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('mode', mode);
        formData.append('target_format', targetFormat);
        formData.append('target_size_kb', String(targetSizeKb));

        setCurrentStepIndex(1);
        setProgress(30);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        setCurrentStepIndex(2);
        setProgress(50);

        const response = await fetch(`${apiUrl}/api/upload-batch`, {
          method: 'POST',
          body: formData,
        });

        setCurrentStepIndex(3);
        setProgress(75);

        if (!response.ok) {
          const err = await response.json().catch(() => ({ detail: "Processing failed" }));
          throw new Error(err.detail || "Processing failed");
        }

        const data = await response.json();

        setCurrentStepIndex(4);
        setProgress(100);

        sessionStorage.setItem('processedResult', JSON.stringify(data));
        clearPendingFile();

        setTimeout(() => router.push('/result'), 800);

      } catch (err: any) {
        console.error(err);
        clearPendingFile();
        alert(`Processing failed: ${err.message || "Please try again."}`);
        router.push('/');
      }
    };

    processFiles();
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
            transition={{ type: "tween", ease: "linear", duration: 0.3 }}
          />
        </div>

        <div className="w-24 h-24 mx-auto bg-brand-500/10 rounded-full flex items-center justify-center mb-8 border border-brand-500/30 text-brand-400">
           {steps[currentStepIndex]?.icon}
        </div>
        
        <h2 className="text-3xl font-bold mb-1">Processing Files</h2>
        <p className="text-text-secondary text-sm mb-2 truncate max-w-xs mx-auto">{fileLabel}</p>
        <p className="text-brand-400 font-medium h-6">
           {steps[currentStepIndex]?.label}
        </p>
        
        <div className="mt-10 space-y-3 hidden sm:block">
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${idx === currentStepIndex ? 'bg-glass-bg border border-brand-500/20' : 'opacity-40'}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${idx <= currentStepIndex ? 'bg-brand-500 text-white' : 'bg-glass-border text-text-secondary'}`}>
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
