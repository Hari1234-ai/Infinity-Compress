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
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-brand-500">Compress</span> Anything.
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500"> Convert</span> Everything.
        </h1>
        
        <p className="text-base md:text-lg text-text-secondary max-w-lg mx-auto mb-8">
          Drop any file type below. The engine will instantly analyze, compress without losing quality, and optionally convert formats.
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
