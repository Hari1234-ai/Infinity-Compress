"use client";

import React from 'react';
import { Download, RefreshCcw, Share2, FileCheck2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ResultCard({ processedData }: { processedData: any }) {
  const router = useRouter();

  if (!processedData) return null;

  const { fileId, fileName, originalSize, compressedSize, compressionRatio, detectedType } = processedData;

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  const handleDownload = () => {
    // Navigate straight to download endpoint to initialize browser download
    if (fileId) {
      window.open(`http://localhost:8000/api/download/${fileId}`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel p-8 md:p-12 text-center"
      >
        <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
           <FileCheck2 className="w-10 h-10 text-green-400" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Optimization Complete</h2>
        <p className="text-text-secondary w-full max-w-sm mx-auto truncate mb-8">
           {fileName}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10 bg-glass-bg p-6 rounded-2xl border border-glass-border">
           <div className="flex flex-col">
             <span className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Original</span>
             <span className="text-lg font-bold text-gray-300">{formatSize(originalSize)}</span>
           </div>
           <div className="flex flex-col items-center justify-center">
             <ArrowRight className="w-6 h-6 text-brand-500" />
           </div>
           <div className="flex flex-col">
             <span className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Compressed</span>
             <span className="text-xl font-bold text-green-400">{formatSize(compressedSize)}</span>
           </div>
           <div className="col-span-3 mt-4 pt-4 border-t border-glass-border flex justify-between items-center text-sm">
             <span className="text-text-secondary">Type: <span className="text-white font-medium">{detectedType}</span></span>
             <span className="text-text-secondary bg-brand-500/10 text-brand-400 py-1 px-3 rounded-full font-bold">
               Saved {compressionRatio}%
             </span>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
          >
            <Download className="w-5 h-5" />
            <span>Download File</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
             onClick={() => router.push('/')}
            className="flex-1 bg-glass-bg border border-glass-border hover:bg-glass-bg/80 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Compress Another</span>
          </motion.button>
        </div>
        
        <p className="text-xs text-text-secondary border-t border-glass-border py-4 mt-6">
          This file was optimized using adaptive compression techniques to reduce size while maintaining visual and structural fidelity.
        </p>
      </motion.div>
    </div>
  );
}
