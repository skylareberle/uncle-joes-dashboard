/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Location, Member, Order, LoginResponse } from './types';

const BASE_URL = 'https://uncle-joes-api-556060884056.us-central1.run.app';

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

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
  getMenuCategories: () => fetcher<string[]>('/menu/categories'),
  getMenuGrouped: () => fetcher<Record<string, MenuItem[]>>('/menu/grouped'),
  getMenuByCategory: (category: string) => fetcher<MenuItem[]>(`/menu/category/${encodeURIComponent(category)}`),
  searchMenu: (itemName: string) => fetcher<MenuItem[]>(`/menu/search/keyword?q=${encodeURIComponent(itemName)}`),
  getMenuItem: (itemId: string) => fetcher<MenuItem>(`/menu/${itemId}`),

  // Locations
  getLocations: () => 
    // Fallback to searching by a common state or just fetching all states then locations
    // But let's try /locations first as it might be there even if not in openapi.json
    // Actually, according to openapi, we should probably use states to fetch them.
    fetcher<Location[]>('/locations').catch(() => []), 
  getLocationStates: () => fetcher<string[]>('/locations/states'),
  getLocationsByState: (state: string) => fetcher<Location[]>(`/locations/filter/state/${encodeURIComponent(state)}`),
  getLocationsByCity: (city: string) => fetcher<Location[]>(`/locations/filter/city/${encodeURIComponent(city)}`),
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
