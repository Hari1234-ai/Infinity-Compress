"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function UploadZone() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState("AUTO");
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
    // Basic validation could happen here
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptimizeNow = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate initial prep and then go to process page
    // In a real app we might start upload here or on process page
    // For this flow, we will pass the file to context or state, 
    // but since we want it simple, let's upload it here and pass the ID

    try {
      const file = selectedFiles[0]; // Process first file for demo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_format', outputFormat);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      
      // Store in session storage for the demo
      sessionStorage.setItem('processedResult', JSON.stringify(data));
      
      // Redirect to process page (which simulates the progress UI)
      router.push('/process');
      
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert("Error occurred while uploading.");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12">
      <div 
        className={`glass-panel p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] cursor-pointer
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
          accept="image/*,application/pdf"
          className="hidden" 
          onChange={handleChange} 
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-glass-bg flex items-center justify-center mb-2 shadow-2xl">
            <UploadCloud className="w-10 h-10 text-brand-500" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">Drag & Drop Files Here</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            Support for Images & PDF Documents. We optimize them locally in memory.
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
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Ready to Process</h4>
            <div className="space-y-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="glass-panel p-4 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-glass-bg rounded-lg">
                      <File className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                      <p className="text-xs text-text-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-2 text-text-secondary hover:text-red-400 hover:bg-glass-bg rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between bg-glass-bg p-4 rounded-xl border border-glass-border">
              <span className="text-sm font-medium text-text-secondary">Image Output Format:</span>
              <select 
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="bg-[#0b0f1a] text-white text-sm rounded border border-glass-border px-3 py-1.5 focus:outline-none focus:border-brand-500"
              >
                <option value="AUTO">Auto (WebP)</option>
                <option value="JPEG">JPEG</option>
                <option value="PNG">PNG</option>
              </select>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUploading}
              onClick={handleOptimizeNow}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all
              ${isUploading ? 'bg-brand-600 opacity-75 cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:shadow-brand-500/40'}`}
            >
              <span>{isUploading ? 'Uploading...' : 'Optimize Now'}</span>
              {!isUploading && <ChevronRight className="w-5 h-5" />}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
