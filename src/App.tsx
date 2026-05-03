import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MenuView from './components/MenuView';
import LocationsView from './components/LocationsView';
import MemberView from './components/MemberView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('menu');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return <MenuView />;
      case 'locations':
        return <LocationsView />;
      case 'member':
        return <MemberView isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
      default:
        return <MenuView />;
    }
  };

  return (
    <div className="min-h-screen bg-off-white text-brand-brown">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isLoggedIn={isLoggedIn} />
      
      <main className="pl-64 min-h-screen">
        <header className="h-16 flex items-center justify-between px-10 sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-brand-brown/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-[0.2em]">Uncle Joe's</span>
            <span className="text-brand-brown/20 text-lg font-thin">/</span>
            <span className="text-[10px] font-bold text-brand-red uppercase tracking-[0.2em]">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-6">
            {isLoggedIn && (
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                <span className="text-[10px] text-brand-red font-bold uppercase tracking-wider">Member Session</span>
              </div>
            )}
            <div className="w-8 h-8 bg-brand-tan rounded-lg border border-brand-brown/10 flex items-center justify-center text-white font-bold text-xs">
              UJ
            </div>
          </div>
        </header>

        <div className="px-10 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
