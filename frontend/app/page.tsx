"use client";

import UploadZone from "@/components/UploadZone";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center w-full max-w-4xl"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 mb-6 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
          </span>
          <span>Infinity Engine 2.0 Live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-brand-500">Compress</span> Anything.
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500"> Convert</span> Everything.
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
          Drop any file type below. The engine will instantly analyze, compress without losing perceptual quality, and optionally convert to modern formats.
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full"
      >
        <UploadZone />
      </motion.div>
    </div>
  );
}
