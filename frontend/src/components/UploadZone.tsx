"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, ChevronRight, Files } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { setPendingFiles } from '@/lib/fileStore';

const MAX_FILES = 20;

export default function UploadZone() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<"compress" | "convert">("compress");
  const [outputFormat, setOutputFormat] = useState("AUTO");
  const [targetSizeKb, setTargetSizeKb] = useState(0); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setSelectedFiles(prev => {
      const combined = [...prev, ...files];
      return combined.slice(0, MAX_FILES); // Enforce 20 file limit
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptimizeNow = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      setPendingFiles(selectedFiles, activeTab.toUpperCase(), outputFormat, targetSizeKb);
      router.push('/process');
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12">
      {/* Tab Switcher */}
      <div className="flex items-center justify-center mb-6">
        <div className="bg-glass-bg p-1 rounded-2xl border border-glass-border flex space-x-1">
          <button 
            onClick={() => setActiveTab("compress")}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === "compress" ? "text-white" : "text-text-secondary hover:text-white"}`}
          >
            {activeTab === "compress" && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-brand-500 rounded-xl -z-10 shadow-lg shadow-brand-500/20" />
            )}
            Compress
          </button>
          <button 
            onClick={() => setActiveTab("convert")}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === "convert" ? "text-white" : "text-text-secondary hover:text-white"}`}
          >
            {activeTab === "convert" && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-brand-500 rounded-xl -z-10 shadow-lg shadow-brand-500/20" />
            )}
            Convert
          </button>
        </div>
      </div>

      <div 
        className={`glass-panel p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] cursor-pointer
        ${isDragActive ? 'border-brand-500 bg-brand-500/10' : 'border-glass-border hover:border-brand-500/50 hover:bg-glass-bg/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/*,application/pdf,image/svg+xml"
          className="hidden" 
          onChange={handleChange} 
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-glass-bg flex items-center justify-center mb-2 shadow-2xl relative">
            <UploadCloud className="w-10 h-10 text-brand-500" />
            {selectedFiles.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                {selectedFiles.length}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">Drag & Drop Files Here</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            {activeTab === "compress" 
              ? `Up to ${MAX_FILES} files · Images, SVGs & PDFs · Output as ZIP` 
              : `Up to ${MAX_FILES} files · Transform format for all files at once`
            }
          </p>
          <button className="mt-4 px-6 py-2.5 bg-glass-bg border border-glass-border rounded-lg text-sm font-medium hover:bg-brand-500/20 hover:border-brand-500 transition-colors">
            Browse Files
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Files className="w-4 h-4" />
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready
              </h4>
              {selectedFiles.length < MAX_FILES && (
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  + Add more
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="glass-panel p-3 flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-glass-bg rounded-lg flex-shrink-0">
                      <File className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                      <p className="text-xs text-text-secondary">{formatBytes(file.size)} · {file.type || 'Unknown'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-glass-bg rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "convert" ? (
                <motion.div 
                  key="convert-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-glass-bg p-4 rounded-xl border border-glass-border">
                    <span className="text-sm font-medium text-text-secondary">Output Format:</span>
                    <select 
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="bg-[#0b0f1a] text-white text-sm rounded border border-glass-border px-3 py-1.5 focus:outline-none focus:border-brand-500"
                    >
                      <option value="AUTO">Auto (WebP)</option>
                      <option value="JPEG">JPEG</option>
                      <option value="PNG">PNG</option>
                      <option value="SVG">SVG (Vector)</option>
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="compress-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-glass-bg p-4 rounded-xl border border-glass-border">
                    <span className="text-sm font-medium text-text-secondary">Target Size (Max):</span>
                    <select 
                      value={targetSizeKb}
                      onChange={(e) => setTargetSizeKb(Number(e.target.value))}
                      className="bg-[#0b0f1a] text-white text-sm rounded border border-glass-border px-3 py-1.5 focus:outline-none focus:border-brand-500"
                    >
                      <option value={0}>Auto (Best)</option>
                      <option value={10}>10 KB (Aggressive)</option>
                      <option value={20}>20 KB</option>
                      <option value={50}>50 KB</option>
                      <option value={100}>100 KB</option>
                      <option value={200}>200 KB</option>
                      <option value={500}>500 KB</option>
                      <option value={1024}>1 MB</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUploading}
              onClick={handleOptimizeNow}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all
              ${isUploading ? 'bg-brand-600 opacity-75 cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:shadow-brand-500/40'}`}
            >
              <span>{isUploading ? 'Processing...' : activeTab === "compress" ? `Optimize ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : `Convert ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}</span>
              {!isUploading && <ChevronRight className="w-5 h-5" />}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
