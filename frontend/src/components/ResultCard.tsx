"use client";

import React from 'react';
import { Download, RefreshCcw, Share2, FileCheck2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ResultCard({ processedData }: { processedData: any }) {
  const router = useRouter();

  if (!processedData) return null;

  const { fileId, fileName, originalSize, compressedSize, compressionRatio, detectedType, mode } = processedData;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getFormatIcon = (type: string) => {
    const ext = type.split('/').pop()?.toUpperCase() || 'FILE';
    return (
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-brand-500/10 rounded-xl border border-brand-500/30 flex items-center justify-center text-brand-500 font-black text-xl mb-2">
          {ext}
        </div>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{type}</span>
      </div>
    );
  };

  const handleDownload = () => {
    if (fileId) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      window.open(`${apiUrl}/api/download/${fileId}`, '_blank');
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
        
        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          {mode === "CONVERT" ? "Format Converted" : "Optimization Complete"}
        </h2>
        <p className="text-text-secondary w-full max-w-sm mx-auto truncate mb-8">
           {fileName}
        </p>

        {mode === "CONVERT" ? (
          /* CONVERT MODE UI: Format Transformation Focus */
          <div className="mb-10 bg-glass-bg p-8 rounded-2xl border border-glass-border relative overflow-hidden">
             <div className="flex items-center justify-around relative z-10">
                {getFormatIcon("original")} 
                <motion.div 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <ArrowRight className="w-8 h-8 text-brand-500" />
                </motion.div>
                {getFormatIcon(detectedType)}
             </div>
             
             <div className="mt-8 pt-6 border-t border-glass-border flex justify-between items-center text-sm">
                <div className="flex flex-col items-start">
                  <span className="text-text-secondary text-[10px] uppercase font-bold tracking-tighter mb-1">New Size</span>
                  <span className="text-white font-bold">{formatSize(compressedSize)}</span>
                </div>
                <div className="bg-brand-500/10 text-brand-400 py-1 px-4 rounded-full font-black text-xs uppercase tracking-widest">
                  Success
                </div>
             </div>
          </div>
        ) : (
          /* COMPRESS MODE UI: Size Comparison Focus */
          <div className="grid grid-cols-3 gap-4 mb-10 bg-glass-bg p-6 rounded-2xl border border-glass-border">
             <div className="flex flex-col">
               <span className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Original</span>
               <span className="text-lg font-bold text-gray-300">{formatSize(originalSize)}</span>
             </div>
             <div className="flex items-center justify-center">
               <ArrowRight className="w-6 h-6 text-brand-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Optimized</span>
               <span className="text-xl font-bold text-green-400">{formatSize(compressedSize)}</span>
             </div>
             <div className="col-span-3 mt-4 pt-4 border-t border-glass-border flex justify-between items-center text-sm">
               <span className="text-text-secondary">Type: <span className="text-white font-medium">{detectedType}</span></span>
               <span className="text-text-secondary bg-brand-500/10 text-brand-400 py-1 px-3 rounded-full font-bold">
                 Saved {compressionRatio}%
               </span>
             </div>
          </div>
        )}

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
