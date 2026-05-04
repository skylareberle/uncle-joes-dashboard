/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Location, Member, Order, LoginResponse } from './types';

const BASE_URL = 'https://uncle-joes-api-556060884056.us-central1.run.app';

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (error: any) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Network error or CORS issue. Please check the Cloud Run logs for 'uncle-joes-api'. The backend might have crashed before returning CORS headers.`);
    }
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.message || errorData.detail;
    
    if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail.map((d: any) => d.msg).join(', ');
    } else if (typeof errorData.detail === 'object') {
      errorMessage = JSON.stringify(errorData.detail);
    }
    
    throw new Error(errorMessage || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Menu
  getMenu: () => fetcher<MenuItem[]>('/menu'),
  getMenuCategories: async () => {
    const items = await fetcher<MenuItem[]>('/menu');
    const categories = new Set(items.map(item => item.category));
    return Array.from(categories);
  },
  getMenuGrouped: async () => {
    const items = await fetcher<MenuItem[]>('/menu');
    const grouped: Record<string, MenuItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  },
  getMenuByCategory: async (category: string) => {
    const items = await fetcher<MenuItem[]>('/menu');
    return items.filter(item => item.category === category);
  },
  searchMenu: async (itemName: string) => {
    const items = await fetcher<MenuItem[]>('/menu');
    const lowerQuery = itemName.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(lowerQuery));
  },
  getMenuItem: (itemId: string) => fetcher<MenuItem>(`/menu/${itemId}`),

  // Locations
  getLocations: () => fetcher<Location[]>('/locations').catch(() => []),
  getLocationStates: async () => {
    const locations = await fetcher<Location[]>('/locations').catch(() => []);
    const states = new Set(locations.map(l => l.state));
    return Array.from(states).filter(Boolean);
  },
  getLocationsByState: async (state: string) => {
    const locations = await fetcher<Location[]>('/locations').catch(() => []);
    return locations.filter(l => l.state === state);
  },
  getLocationsByCity: async (city: string) => {
    return fetcher<Location[]>(`/locations/search?query_str=${encodeURIComponent(city)}`).catch(() => []);
  },
  getLocation: (locationId: string) => fetcher<Location>(`/locations/${locationId}`),

  // Auth & Members
  login: (credentials: { email: string; password: string }) => 
    fetcher<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () => fetcher<any>('/logout', { method: 'POST' }),
  getMemberOrders: (member_id: string) => fetcher<Order[]>(`/members/${member_id}/orders`),
  getMemberPoints: (member_id: string) => fetcher<{ points: number }>(`/members/${member_id}/points`),
};
