/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coffee, MapPin, User, LogOut, ChevronRight, Menu as MenuIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, isLoggedIn }: SidebarProps) {
  const menuItems = [
    { id: 'menu', label: 'Our Menu', icon: Coffee },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'member', label: 'Member Club', icon: User },
  ];

  return (
    <div className="w-64 h-full bg-brand-brown text-brand-tan flex flex-col p-6 fixed left-0 top-0 z-50 border-r border-brand-brown/10 shadow-2xl">
      <div className="flex flex-col mb-10 px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shadow-lg">
            <Coffee className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Uncle Joe's</h1>
        </div>
        <p className="text-[10px] text-brand-tan/60 font-medium tracking-wide">EST. 1994 — FRESH ROAST</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-brand-tan/20 text-white border border-brand-tan/10'
                : 'hover:bg-brand-tan/10 text-brand-tan hover:text-white'
            }`}
          >
            <item.icon size={18} className={activeTab === item.id ? 'text-brand-tan' : 'group-hover:scale-110 transition-transform duration-200'} />
            <span className="font-bold text-sm tracking-wide">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="bubble" className="ml-auto w-1 h-1 bg-white rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-brand-tan/20">
        <div className="p-4 rounded-xl bg-brand-tan/10 border border-brand-tan/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-brand-tan/60 uppercase tracking-widest">Kitchen</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 font-bold rounded">OPEN</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white/80">Serving Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
