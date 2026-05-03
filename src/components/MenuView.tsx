/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { MenuItem } from '../types';
import { Search, Loader2, AlertCircle, ShoppingCart, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MenuView() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllMenuData();
  }, []);

  const loadAllMenuData = async () => {
    setLoading(true);
    setError(null);
    try {
      const groupedData = await api.getMenuGrouped();
      const cats = Object.keys(groupedData);
      setCategories(['All', ...cats]);
      
      const allItems = Object.values(groupedData).flat();
      setItems(allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu data');
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    // No longer needed separately, but keeping signature for now if needed or removing references
  };

  const loadItems = async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!category || category === 'All') {
        const data = await api.getMenu();
        setItems(data);
      } else {
        const data = await api.getMenuByCategory(category);
        setItems(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadItems(selectedCategory);
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchMenu(searchQuery);
      setItems(data);
      setSelectedCategory('All');
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewItemDetail = async (id: string) => {
    try {
      const item = await api.getMenuItem(id);
      alert(`Product Detail: ${item.name}\nCategory: ${item.category}\nCalories: ${item.calories}\nPrice: $${item.price.toFixed(2)}`);
    } catch (err) {
      console.error('Failed to load item detail', err);
    }
  };

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    loadItems(cat);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-brown mb-2 tracking-tight">Our Coffee Collection</h2>
          <p className="text-brand-brown/60 text-sm font-medium">Freshly roasted daily, served with love and a smile.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/30" size={16} />
          <input
            type="text"
            placeholder="Find your favorite..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-brown/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
          />
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => selectCategory(cat)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border ${
              selectedCategory === cat
                ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20'
                : 'bg-white border-brand-brown/10 text-brand-brown hover:text-brand-red hover:border-brand-red/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-brand-tan/20 border-t-brand-red rounded-full animate-spin"></div>
          <p className="text-brand-brown/40 text-xs font-bold tracking-widest uppercase">Fetching Menu...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 bg-brand-red/5 rounded-3xl border border-brand-red/10 px-6 font-bold">
          <AlertCircle className="text-brand-red mb-4" size={32} />
          <h3 className="text-sm font-bold text-brand-brown uppercase tracking-widest mb-1">Catalog Sync Failure</h3>
          <p className="text-brand-brown/60 text-xs text-center max-w-sm mb-6">{error}</p>
          <button 
            onClick={() => loadItems(selectedCategory)}
            className="px-6 py-2 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl text-xs font-bold hover:bg-brand-red/20 transition-all uppercase tracking-widest"
          >
            Retry Sync
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-brand-brown/10 rounded-3xl bg-white shadow-inner">
          <p className="text-brand-brown/40 text-xs font-bold uppercase tracking-widest">No items found.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="coffee-card group cursor-pointer"
                onClick={() => handleViewItemDetail(item.id)}
              >
                <div className="aspect-[16/10] mb-4 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/30 relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="text-slate-800 group-hover:text-blue-500/30 transition-colors" size={48} />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-sm font-black text-brand-red border border-brand-red/10 shadow-sm">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red mb-1 block">{item.category}</span>
                      <h3 className="text-base font-bold text-brand-brown group-hover:text-brand-red transition-colors">{item.name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-brand-tan/10 rounded-lg flex items-center gap-1.5 transition-all">
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-brand-brown/40">Size</span>
                      <span className="text-[10px] font-bold text-brand-brown">{item.size}</span>
                    </div>
                    <div className="px-2 py-1 bg-brand-tan/10 rounded-lg flex items-center gap-1.5 transition-all">
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-brand-brown/40">Fuel</span>
                      <span className="text-[10px] font-bold text-brand-brown">{item.calories} kCal</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-brand-red text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-red/90 transition-all duration-300 shadow-lg shadow-brand-red/10">
                    <ShoppingCart size={14} />
                    Add to Order
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
