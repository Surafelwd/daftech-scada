import React from "react";
import { motion } from "framer-motion";

export default function HardwareSpecs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-12"
      >
        <img 
          src="/LOGO.png" 
          alt="Daftech DFM-V1 Meter" 
          className="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
        />
      </motion.div>
      
      {/* Empty section for future hardware information */}
      <div className="w-full text-center text-zinc-400 italic serif">
        <p>Hardware specifications and documentation will be added here.</p>
      </div>
    </div>
  );
}
