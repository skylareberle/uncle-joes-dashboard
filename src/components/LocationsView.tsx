/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Location } from '../types';
import { MapPin, Phone, Clock, Loader2, AlertCircle, Filter, Globe, Wifi, Car, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LocationsView() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('All');
  const [citySearch, setCitySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStates();
    loadLocations();
  }, []);

  const loadStates = async () => {
    try {
      const data = await api.getLocationStates();
      const mapped = Array.from(new Set(data.map((s: any) => typeof s === 'string' ? s : s.state || String(s))));
      setStates(['All', ...mapped]);
    } catch (err) {
      console.error('Failed to load states', err);
    }
  };

  const loadLocations = async (state?: string) => {
    setLoading(true);
    setError(null);
    setCitySearch('');
    try {
      let data: Location[];
      if (!state || state === 'All') {
        data = await api.getLocations();
      } else {
        data = await api.getLocationsByState(state);
      }
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const loadLocationsByCity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!citySearch.trim()) return;
    
    setLoading(true);
    setError(null);
    setSelectedState('All');
    try {
      const data = await api.getLocationsByCity(citySearch);
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'City search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLocationDetail = async (id: string) => {
    try {
      // Just illustrating the endpoint usage as requested
      const details = await api.getLocation(id);
      alert(`Store Details: ${details.address_one}\nStatus: ${details.open_for_business ? 'Open' : 'Closed'}\nPhone: ${details.phone_number || 'No phone listed'}`);
    } catch (err) {
      console.error('Failed to load location details', err);
    }
  };

  const selectState = (state: string) => {
    setSelectedState(state);
    loadLocations(state);
  };

  const formatTime = (timeNum: number) => {
    const hours = Math.floor(timeNum / 100);
    const mins = timeNum % 100;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-brown mb-2 tracking-tight">Our Neighborhood Shops</h2>
          <p className="text-brand-brown/60 text-sm font-medium">Stop by for a chat and a fresh brew.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <form onSubmit={loadLocationsByCity} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by city..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-white border border-brand-brown/10 rounded-xl text-xs font-bold uppercase tracking-widest text-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all shadow-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-brown/30 hover:text-brand-red transition-colors">
              <Globe size={14} />
            </button>
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter size={14} className="text-brand-brown/30" />
            <select 
              value={selectedState}
              onChange={(e) => selectState(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-brand-brown/10 rounded-xl text-xs font-bold uppercase tracking-widest text-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all cursor-pointer shadow-sm"
            >
              {states.map(state => (
                <option key={state} value={state} className="bg-white text-brand-brown text-[10px]">{state === 'All' ? 'All Regions' : state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-brand-tan/20 border-t-brand-red rounded-full animate-spin"></div>
          <p className="text-brand-brown/40 text-xs font-bold tracking-widest uppercase">Finding shops...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 bg-brand-red/5 rounded-3xl border border-brand-red/10 px-6 font-bold">
          <AlertCircle className="text-brand-red mb-4" size={32} />
          <h3 className="text-sm font-bold text-brand-brown uppercase tracking-widest mb-1">Search Error</h3>
          <p className="text-brand-brown/60 text-xs mb-6">{error}</p>
          <button 
            onClick={() => loadLocations(selectedState)}
            className="px-6 py-2 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl text-xs font-bold hover:bg-brand-red/20 transition-all uppercase tracking-widest"
          >
            Try Again
          </button>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-brand-brown/10 rounded-3xl bg-white shadow-inner">
          <Globe className="mx-auto text-brand-brown/10 mb-4" size={48} />
          <p className="text-brand-brown/40 text-xs font-bold uppercase tracking-widest">No shops in this area yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {locations.map((loc, index) => (
              <motion.div
                key={`${loc.id}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="coffee-card flex flex-col sm:flex-row gap-6 bg-white shadow-sm hover:shadow-md"
              >
                <div className="w-full sm:w-32 h-32 bg-off-white rounded-2xl flex-shrink-0 flex items-center justify-center border border-brand-brown/5">
                  <div className="text-center">
                    <MapPin className="text-brand-red mx-auto mb-2 opacity-40" size={24} />
                    <span className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest">{loc.city}</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-brand-brown">{loc.city} • {loc.address_one}</h3>
                      <span className={`px-2 py-0.5 ${loc.open_for_business ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-brand-red/10 text-brand-red border-brand-red/20'} text-[10px] font-bold rounded uppercase tracking-widest border`}>
                        {loc.open_for_business ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-xs text-brand-brown/60 mb-2 flex items-start gap-2 leading-relaxed">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0 text-brand-tan" />
                      {loc.address_one}{loc.address_two ? `, ${loc.address_two}` : ''}, {loc.city}, {loc.state} {loc.zip_code}
                    </p>
                    
                    <div className="flex gap-3 mb-4">
                      {loc.wifi && <div title="Wifi Available"><Wifi size={14} className="text-brand-brown/30" /></div>}
                      {loc.drive_thru && <div title="Drive Thru Available"><Car size={14} className="text-brand-brown/30" /></div>}
                      {loc.door_dash && <div title="DoorDash Support"><Bike size={14} className="text-brand-brown/30" /></div>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-brand-brown/40 uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-brand-tan" />
                        {loc.phone_number || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-brand-tan" />
                        {formatTime(loc.hours_monday_open)} - {formatTime(loc.hours_monday_close)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <button className="flex-1 py-2.5 bg-brand-brown text-white rounded-xl text-[10px] font-bold hover:bg-brand-red transition-all uppercase tracking-widest shadow-sm shadow-brand-brown/10">
                      Get Directions
                    </button>
                    <button 
                      onClick={() => handleViewLocationDetail(loc.id)}
                      className="flex-1 py-2.5 bg-white border border-brand-brown/10 text-brand-brown/60 rounded-xl text-[10px] font-bold hover:text-brand-brown hover:border-brand-brown/30 transition-all uppercase tracking-widest"
                    >
                      Store Info
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
