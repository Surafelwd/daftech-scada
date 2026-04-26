import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Droplets, LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { signIn } from '../firebase';
import Dashboard from './Dashboard';
import SiteManagement from './SiteManagement';
import Analytics from './Analytics';
import CommandCenter from './CommandCenter';


const SLIDE_PAGES = [
  {
    title: "Global Dashboard",
    description: "Live interactive overview of the entire SCADA network, alarms, and ingestion rates.",
    component: <Dashboard />,
    color: "from-blue-50 to-indigo-50 border-indigo-100",
    path: "/"
  },
  {
    title: "Industrial Map Interface",
    description: "Live geospatial telemetry showing real-time meter locations and active alarm clusters.",
    component: <SiteManagement mapOnly />,
    color: "from-sky-50 to-blue-50 border-sky-100",
    path: "/sites"
  },
  {
    title: "Site Hierarchy Status",
    description: "Organize assets by geography, verify regional health, and monitor network topology.",
    component: <SiteManagement sitesOnly />,
    color: "from-indigo-50 to-purple-50 border-purple-100",
    path: "/sites"
  },
  {
    title: "Advanced Analytics",
    description: "Deep dive into battery trending, communication health, and predictive leak detection.",
    component: <Analytics />,
    color: "from-blue-50 to-cyan-50 border-blue-100",
    path: "/analytics"
  },
  {
    title: "Command Lifecycle",
    description: "Direct control center to issue valves overrides and immediate reading sync requests.",
    component: <CommandCenter />,
    color: "from-zinc-50 to-zinc-100 border-zinc-200",
    path: "/commands"
  }
];

export const WelcomePage = ({ onEnter }: { onEnter: () => void }) => {
  const [index, setIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % SLIDE_PAGES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setIndex((prev) => (prev - 1 + SLIDE_PAGES.length) % SLIDE_PAGES.length);
  }, []);

  // Auto-slide logic
  useEffect(() => {
    const timer = setInterval(nextSlide, 9000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 overflow-hidden flex flex-col font-sans">
      {/* Navigation Header */}
      <nav className="p-6 flex justify-between items-center border-b border-zinc-200 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Droplets size={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter italic serif">DAFTECH-SCADA</span>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 text-sm font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors">Documentation</button>
          <button 
            onClick={() => signIn().catch(console.error)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-zinc-900/10"
          >
            <LogIn size={16} />
            Login
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-4 py-12">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Static Content */}
          <div className="space-y-8 z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-blue-600 font-bold tracking-widest uppercase text-xs mb-4">Enterprise IoT Management</h2>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight italic serif text-zinc-900">
                Precision Control for <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                  Ultrasonic Networks
                </span>
              </h1>
              <p className="mt-6 text-zinc-500 text-lg max-w-md leading-relaxed">
                A robust, production-ready SCADA platform designed for daily telemetry synchronization, predictive maintenance, and mission-critical reliability.
              </p>
              <div className="mt-10 flex gap-4 items-center">
                <button 
                  onClick={() => onEnter()}
                  className="flex items-center justify-center h-14 px-8 text-sm font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-full group transition-all shadow-lg shadow-blue-600/20"
                >
                  Enter Dashboard 
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                
                {/* Creative Meter Display redirecting to Hardware Specs */}
                <motion.button 
                  onClick={() => onEnter('/hardware')}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="relative group cursor-pointer ml-8 w-56 h-56 flex items-center justify-center focus:outline-none -my-10"
                  title="View Hardware Specifications"
                >
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all duration-500" />
                  <img 
                    src="/LOGO.png" 
                    alt="Meter Hardware" 
                    className="w-full h-full object-contain z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)] group-hover:-translate-y-2 transition-all duration-500" 
                  />
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Animated Feature Slider */}
          <div className="relative h-[550px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`w-full max-w-2xl h-full p-6 pb-20 pt-8 rounded-[2rem] border backdrop-blur-xl bg-gradient-to-br ${SLIDE_PAGES[index].color} shadow-2xl absolute z-10 flex flex-col items-center justify-center`}
              >
                <div 
                  className="w-full flex-1 rounded-xl overflow-hidden bg-white/60 mb-6 border border-zinc-200 shadow-inner relative cursor-pointer group"
                  onClick={() => onEnter(SLIDE_PAGES[index].path)}
                >
                  <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white text-zinc-900 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                      Go to {SLIDE_PAGES[index].title} <ArrowRight size={18} />
                    </div>
                  </div>
                  {/* Miniature Page Container via CSS transform */}
                  <div className="absolute top-0 left-0 w-[300%] h-[300%] origin-top-left scale-[0.333333] pointer-events-none p-4">
                    {SLIDE_PAGES[index].component}
                  </div>
                </div>
                
                <div className="mt-auto text-center shrink-0 h-[80px] flex flex-col items-center justify-end z-20 relative">
                  <h3 className="text-2xl font-extrabold mb-2 text-zinc-900 italic serif tracking-tight">
                    {SLIDE_PAGES[index].title}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed text-sm px-4 overflow-hidden">
                    {SLIDE_PAGES[index].description}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="absolute bottom-6 left-10 right-10 flex items-center justify-between z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="p-2 bg-white/50 hover:bg-white rounded-full text-zinc-700 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex gap-2">
                    {SLIDE_PAGES.map((_, i) => (
                      <button 
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                        className={`h-2 rounded-full transition-all duration-500 ${i === index ? 'w-10 bg-blue-600' : 'w-3 bg-zinc-300 hover:bg-zinc-400'}`}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="p-2 bg-white/50 hover:bg-white rounded-full text-zinc-700 transition-colors shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100 to-transparent pointer-events-none -z-10" />
          </div>
        </div>
      </main>

      {/* Stats Footer */}
      <footer className="p-8 border-t border-zinc-200 bg-white backdrop-blur-sm mt-auto relative z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-zinc-900 italic serif">100k+</div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Active Meters</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-zinc-900 italic serif">99.9%</div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Daily Ingestion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-zinc-900 italic serif">&lt; 50ms</div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Query Latency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-zinc-900 italic serif">ISO-27001</div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Security Ready</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
