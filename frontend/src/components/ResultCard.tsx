"use client";

import React, { useState } from 'react';
import { Download, RefreshCcw, FileCheck2, ArrowRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ResultCard({ processedData }: { processedData: any }) {
  const router = useRouter();

  if (!processedData) return null;

  // Batch result
  const isBatch = !!processedData.batchId;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const formatSize = (bytes: number) => {
    if (!bytes || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const id = isBatch ? processedData.batchId : processedData.fileId;
    if (!id) return;
    
    try {
      setIsDownloading(true);
      const res = await fetch(`${apiUrl}/api/download/${id}`);
      
      if (!res.ok) {
        alert("Download failed. The file may have expired from memory. Please process again.");
        return;
      }
      
      // If Render container restarted, it may return HTML instead of the file
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
          alert("Server is currently restarting. Please try processing the files again.");
          return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      const filename = isBatch ? "infinitycompress_batch.zip" : (processedData.fileName || "download");
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to download the file.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── BATCH RESULT UI ───────────────────────────────────────────
  if (isBatch) {
    const { batchId, fileCount, successCount, totalOriginalSize, totalCompressedSize, compressionRatio, mode, files } = processedData;
    const failed = fileCount - successCount;

    return (
      <div className="w-full max-w-2xl mx-auto">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-8 md:p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Package className="w-10 h-10 text-green-400" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
            {mode === "CONVERT" ? "Batch Converted!" : "Batch Optimized!"}
          </h2>
          <p className="text-text-secondary mb-8 text-sm">
            {successCount} of {fileCount} files processed successfully
            {failed > 0 && <span className="text-red-400 ml-1">· {failed} failed</span>}
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 bg-glass-bg p-6 rounded-2xl border border-glass-border">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Total Original</span>
              <span className="text-lg font-bold text-gray-300">{formatSize(totalOriginalSize)}</span>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-brand-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Total Output</span>
              <span className="text-xl font-bold text-green-400">{formatSize(totalCompressedSize)}</span>
            </div>
            <div className="col-span-3 mt-2 pt-4 border-t border-glass-border flex justify-between items-center text-sm">
              <span className="text-text-secondary">{successCount} files in ZIP</span>
              {compressionRatio > 0 && (
                <span className="bg-brand-500/10 text-brand-400 py-1 px-3 rounded-full font-bold text-xs">
                  Saved {compressionRatio}% total
                </span>
              )}
            </div>
          </div>

          {/* Per-file list */}
          {files && files.length > 0 && (
            <div className="mb-8 max-h-48 overflow-y-auto space-y-2 text-left">
              {files.map((f: any, idx: number) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${f.status === 'success' ? 'bg-glass-bg border-glass-border' : 'bg-red-500/5 border-red-500/20'}`}>
                  <span className="truncate text-white max-w-[200px]">{f.originalName}</span>
                  {f.status === 'success' ? (
                    <span className="text-green-400 font-bold flex-shrink-0 ml-2">
                      {formatSize(f.originalSize)} → {formatSize(f.compressedSize)}
                    </span>
                  ) : (
                    <span className="text-red-400 text-xs flex-shrink-0 ml-2">Failed</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
            >
              <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Downloading...' : 'Download ZIP'}</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="flex-1 bg-glass-bg border border-glass-border hover:bg-glass-bg/80 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2"
            >
              <RefreshCcw className="w-5 h-5" />
              <span>Process More</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── SINGLE FILE RESULT UI (legacy fallback) ──────────────────
  const { fileId, fileName, originalSize, compressedSize, compressionRatio, detectedType, mode } = processedData;

  const getFormatIcon = (type: string) => {
    const ext = type.split('/').pop()?.toUpperCase() || 'FILE';
    const textClass = ext.length > 5 ? 'text-xs text-center px-1 break-words leading-tight' : 'text-xl';
    return (
      <div className="flex flex-col items-center">
        <div className={`w-16 h-16 bg-brand-500/10 rounded-xl border border-brand-500/30 flex items-center justify-center text-brand-500 font-black mb-2 ${textClass}`}>
          {ext}
        </div>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{type}</span>
      </div>
    );
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
        <p className="text-text-secondary w-full max-w-sm mx-auto truncate mb-8">{fileName}</p>

        {mode === "CONVERT" ? (
          <div className="mb-10 bg-glass-bg p-8 rounded-2xl border border-glass-border">
             <div className="flex items-center justify-around">
                {getFormatIcon("original")} 
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <ArrowRight className="w-8 h-8 text-brand-500" />
                </motion.div>
                {getFormatIcon(detectedType)}
             </div>
             <div className="mt-8 pt-6 border-t border-glass-border flex justify-between items-center text-sm">
                <div className="flex flex-col items-start">
                  <span className="text-text-secondary text-[10px] uppercase font-bold tracking-tighter mb-1">New Size</span>
                  <span className="text-white font-bold">{formatSize(compressedSize)}</span>
                </div>
                <div className="bg-brand-500/10 text-brand-400 py-1 px-4 rounded-full font-black text-xs uppercase tracking-widest">Success</div>
             </div>
          </div>
        ) : (
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
               <span className="bg-brand-500/10 text-brand-400 py-1 px-3 rounded-full font-bold text-xs">Saved {compressionRatio}%</span>
             </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
          >
            <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'Downloading...' : 'Download File'}</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="flex-1 bg-glass-bg border border-glass-border text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Process More</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
