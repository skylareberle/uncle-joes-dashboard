/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Order, MenuItem } from '../types';
import { User, LogIn, Lock, Mail, Star, History, Gift, CheckCircle2, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemberViewProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
}

export default function MemberView({ isLoggedIn, setIsLoggedIn }: MemberViewProps) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [points, setPoints] = useState<number>(0);
  const [serverPoints, setServerPoints] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.login({ 
        email: email.toLowerCase().trim(), 
        password: password.trim() 
      });
      const mId = response.member_id || (response as any).memberId;
      setMemberId(mId);
      setFirstName(response.first_name || 'Uncle');
      setLastName(response.last_name || "Joe's Guest");
      setIsLoggedIn(true);
      await loadMemberData(mId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadMemberData = async (mId: string) => {
    try {
      const [rawOrdersData, pointsData] = await Promise.all([
        api.getMemberOrders(mId),
        api.getMemberPoints(mId)
      ]);
      
      const ordersData = Array.isArray(rawOrdersData) 
        ? rawOrdersData 
        : ((rawOrdersData as any).orders || (rawOrdersData as any).transactions || (rawOrdersData as any).history || []);

      // Deduplicate and normalize orders
      const normalizedOrders = ordersData.reduce((acc: Order[], current: any) => {
        const orderId = current.id || current.order_id || current.orderNumber || 'unknown';
        let order = acc.find(o => o.id === orderId);
        
        // Extract items from current row or handle flat item pattern
        const rawItems = current.items || current.order_items || current.order_details || current.line_items || current.details || [];
        let itemsForThisRow: any[] = [];

        if (Array.isArray(rawItems) && rawItems.length > 0) {
          itemsForThisRow = rawItems.map((item: any) => ({
            item_id: item.item_id || item.id || item.menu_item_id || item.productId || '',
            name: item.name || item.item_name || item.product_name || item.title || 'Coffee Item',
            size: item.size || item.variant || 'Medium',
            quantity: Number(item.quantity || item.qty || item.count || 1),
            price: Number(item.price || item.unit_price || item.amount || 0)
          }));
        } else if (current.item_name || current.product_name || current.name || current.menu_item_id) {
          // This row itself might be an item (flat list pattern)
          itemsForThisRow = [{
            item_id: current.item_id || current.menu_item_id || current.id || 'item-unknown',
            name: current.item_name || current.product_name || current.name || 'Coffee Item',
            size: current.size || 'Medium',
            quantity: Number(current.quantity || current.qty || 1),
            price: Number(current.price || current.unit_price || 0)
          }];
        }

        if (!order) {
          const total = Number(current.total ?? current.order_total ?? current.amount ?? current.grand_total ?? current.order_amount ?? 
                        itemsForThisRow.reduce((s: number, i: any) => s + (i.price * i.quantity), 0));
          
          acc.push({
            id: orderId,
            member_id: current.member_id || current.memberId || mId,
            status: current.status || current.order_status || 'COMPLETED',
            created_at: current.created_at || current.order_date || current.date || current.timestamp || new Date().toISOString(),
            total: total,
            items: itemsForThisRow,
            location_name: current.location_name || current.store_name || current.location || current.store,
            location_city_state: current.location_city_state || (current.city && current.state ? `${current.city}, ${current.state}` : '')
          });
        } else {
          // If order exists, add items from this row if they aren't already included
          itemsForThisRow.forEach(newItem => {
            const itemExists = order!.items.some(existing => 
              (existing.item_id && existing.item_id === newItem.item_id) || 
              (existing.name === newItem.name && existing.size === newItem.size)
            );
            if (!itemExists) {
              order!.items.push(newItem);
            }
          });
          
          // If the order was created with 0 total (inferred), keep updating it
          if (current.total === undefined && current.order_total === undefined && current.amount === undefined && current.grand_total === undefined) {
             order.total = order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
          }
        }
        return acc;
      }, []);

      setOrders(normalizedOrders);
      
      // Calculate points based on normalized totals: 1 point for every whole dollar spent
      const calculatedPoints = normalizedOrders.reduce((sum, order) => {
        return sum + Math.floor(order.total || 0);
      }, 0);
      
      // Use points from server if available (handle common field names)
      const pointsDataAny = pointsData as any;
      const pointsFromServerRaw = pointsDataAny.total_points ?? 
                                  pointsDataAny.points ?? 
                                  pointsDataAny.point_balance ?? 
                                  pointsDataAny.points_balance ?? 
                                  pointsDataAny.pts ?? 
                                  pointsDataAny.balance ?? 
                                  null;
                                  
      const pointsFromServer = pointsFromServerRaw !== null && !isNaN(Number(pointsFromServerRaw)) 
        ? Number(pointsFromServerRaw) 
        : null;
        
      setServerPoints(pointsFromServer);
      setPoints(calculatedPoints);
    } catch (err) {
      console.error('Failed to load member data', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setIsLoggedIn(false);
      setMemberId(null);
      setFirstName('');
      setLastName('');
      setOrders([]);
      setPoints(0);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border border-brand-brown/10 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-red/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-red/10">
              <Lock className="text-brand-red" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-brand-brown tracking-tight">Member Portal</h2>
            <p className="text-brand-brown/60 text-sm mt-1">Signs in to your rewards account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-brown/60 pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/30" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joe@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-off-white border border-brand-brown/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all text-brand-brown"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-brown/60 pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/30" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-off-white border border-brand-brown/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all text-brand-brown"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-brand-red/5 border border-brand-red/10 text-brand-red text-xs rounded-lg flex items-center gap-2 font-medium">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-red text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-brand-red/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-red/20"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn size={16} />}
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-brand-brown/60 font-medium">
            New here? <span className="text-brand-red cursor-pointer hover:underline font-bold">Join the Club</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-end">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-brand-red hover:bg-brand-red/5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-brand-red/10"
        >
          <LogIn size={16} className="rotate-180" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 bg-white border border-brand-brown/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-sm"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-brand-red font-bold uppercase tracking-widest text-[10px] mb-1">Uncle Joe's Rewards</h3>
                <h2 className="text-3xl font-bold text-brand-brown tracking-tight">Welcome Back, {firstName} {lastName}</h2>
              </div>
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-600 tracking-widest">
                MEMBER
              </div>
            </div>
            
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-bold text-brand-brown tracking-tighter">
                    {typeof serverPoints === 'number' ? serverPoints : points}
                  </span>
                  <span className="text-brand-brown/40 font-bold text-xs uppercase tracking-widest">Available Points</span>
                </div>
                {serverPoints !== null && (
                  <div className="flex items-center gap-1.5 mt-1 pl-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-brand-brown/30 uppercase tracking-widest">Synced with server: {serverPoints} pts</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative z-10 space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest">
                <span>Next Reward Level</span>
                <span className="text-brand-red font-black">{(typeof serverPoints === 'number' ? serverPoints : points) % 100}%</span>
              </div>
              <div className="h-2 bg-off-white rounded-full overflow-hidden border border-brand-brown/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((typeof serverPoints === 'number' ? serverPoints : points) % 100)}%` }}
                  className="h-full bg-brand-red"
                />
              </div>
            </div>
            <Star className="absolute -right-12 -top-12 text-brand-red/2 w-64 h-64 rotate-12" />
          </motion.div>

        <div className="md:col-span-4 grid grid-rows-2 gap-5">
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-brand-brown/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center group shadow-sm"
          >
            <Gift className="text-brand-tan group-hover:text-brand-red transition-colors duration-500 mb-3" size={32} />
            <h4 className="font-bold text-brand-brown text-sm mb-1 uppercase tracking-tight">Rewards Shop</h4>
            <p className="text-[10px] text-brand-brown/40 mb-4 uppercase tracking-tighter">You have 2 free coffees waiting!</p>
            <button className="w-full py-2.5 bg-brand-brown text-white rounded-xl text-[10px] font-bold tracking-widest hover:bg-brand-red transition-all uppercase shadow-md shadow-brand-brown/10">Browse Items</button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-brand-brown/10 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 bg-off-white rounded-2xl flex items-center justify-center border border-brand-brown/5">
              <TrendingUp className="text-brand-red" size={24} />
            </div>
            <div>
              <h4 className="font-bold text-brand-brown text-xs uppercase tracking-tight">Status Level</h4>
              <p className="text-[10px] text-brand-brown/40 uppercase tracking-widest mt-0.5">Silver Bean</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <History size={16} className="text-brand-brown/40" />
          <h3 className="text-xs font-bold text-brand-brown/40 uppercase tracking-[0.2em]">Transaction History</h3>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-brand-brown/20 rounded-3xl bg-white shadow-sm">
            <p className="text-brand-brown/40 text-xs font-medium">No recent transactions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedOrder(order)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-brand-brown/5 rounded-2xl hover:border-brand-red/40 hover:bg-brand-red/[0.02] transition-all group shadow-sm cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-off-white rounded-xl flex items-center justify-center border border-brand-brown/5 text-brand-brown/20 group-hover:text-brand-red group-hover:bg-brand-red/10 transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-brown uppercase tracking-tight">#{ order.id.split('-')[0] }</h4>
                    <p className="text-[10px] text-brand-brown/40 uppercase font-bold">{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</p>
                    {(order.location_name || order.location_city_state) && (
                      <p className="text-[9px] text-brand-red font-bold uppercase tracking-tight mt-1">{order.location_name || order.location_city_state}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-12">
                  <div className="text-right">
                    <p className="text-[9px] text-brand-brown/30 uppercase font-bold tracking-widest mb-0.5">Status</p>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{order.status}</span>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-[9px] text-brand-brown/30 uppercase font-bold tracking-widest mb-0.5">Total</p>
                    <span className="text-base font-bold text-brand-brown">${order.total.toFixed(2)}</span>
                    <p className="text-[8px] text-brand-red font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View Details</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-brown/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-brand-brown/10"
            >
              <div className="p-6 border-b border-brand-brown/5 flex items-center justify-between bg-off-white">
                <div>
                  <h3 className="text-xl font-bold text-brand-brown">Order Receipt</h3>
                  <p className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-widest mt-0.5">#{selectedOrder.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-brand-brown/5 flex items-center justify-center text-brand-brown/40 hover:bg-brand-red hover:text-white transition-all"
                >
                  <LogIn size={16} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Points Earned Bar */}
                <div className="bg-brand-red/5 border border-brand-red/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white">
                      <Star size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest">Points Gained</p>
                      <p className="text-lg font-bold text-brand-red">+{Math.floor(selectedOrder.total)} Points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-brand-brown/30 font-bold uppercase">$1 = 1 Point</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-widest pl-1">Order Summary</h4>
                  <div className="bg-off-white rounded-2xl border border-brand-brown/5 divide-y divide-brand-brown/5">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-brand-brown/5 text-brand-brown/40 font-bold text-xs">
                              {item.quantity || 1}x
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brand-brown">{(item.name || item.item_name || 'Coffee Item')} {item.size ? `• ${item.size}` : ''}</p>
                              <p className="text-[10px] text-brand-brown/40 uppercase font-medium">Item @ ${(item.price || 0).toFixed(2)}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-brand-brown">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-brand-brown/30 italic text-xs font-medium">
                        Detailed item logs not available
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-4 border-t border-brand-brown/5 space-y-2">
                  <div className="flex justify-between items-center text-brand-brown/60">
                    <span className="text-xs font-bold uppercase tracking-widest">Date</span>
                    <span className="text-xs font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  {selectedOrder.location_name && (
                    <div className="flex justify-between items-center text-brand-brown/60">
                      <span className="text-xs font-bold uppercase tracking-widest">Location</span>
                      <span className="text-xs font-bold">{selectedOrder.location_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-brand-brown/60">
                    <span className="text-xs font-bold uppercase tracking-widest">Status</span>
                    <span className="text-xs font-bold text-green-600">{selectedOrder.status}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-brand-brown">Grand Total</span>
                    <span className="text-2xl font-black text-brand-red">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-4 bg-brand-brown text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-brand-red transition-all duration-300 shadow-lg shadow-brand-brown/10"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
