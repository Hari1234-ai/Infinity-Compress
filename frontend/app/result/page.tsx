"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResultCard from '@/components/ResultCard';
import { motion } from 'framer-motion';

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Check if we have file data
    const processingData = sessionStorage.getItem('processedResult');
    if (!processingData) {
      router.push('/');
      return;
    }
    
    setData(JSON.parse(processingData));
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 w-full">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center mb-8"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
          <span>Optimization Complete</span>
        </div>
      </motion.div>
      
      {data && <ResultCard processedData={data} />}
    </div>
  );
}
