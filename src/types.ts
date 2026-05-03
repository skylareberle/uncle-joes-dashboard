/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  size: string;
  calories: number;
  price: number;
  image_url?: string;
  description?: string;
}

export interface Location {
  id: string;
  city: string;
  state: string;
  zip_code: number;
  address_one: string;
  address_two: string | null;
  email: string | null;
  phone_number: string | null;
  fax_number: string | null;
  open_for_business: boolean;
  wifi: boolean;
  drive_thru: boolean;
  door_dash: boolean;
  location_map_address: string;
  location_map_lat: number;
  location_map_lng: number;
  near_by: string;
  hours_monday_open: number;
  hours_monday_close: number;
  hours_tuesday_open: number;
  hours_tuesday_close: number;
  hours_wednesday_open: number;
  hours_wednesday_close: number;
  hours_thursday_open: number;
  hours_thursday_close: number;
  hours_friday_open: number;
  hours_friday_close: number;
  hours_saturday_open: number;
  hours_saturday_close: number;
  hours_sunday_open: number;
  hours_sunday_close: number;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  points: number;
}

export interface Order {
  id: string;
  member_id: string;
  items: Array<{ 
    item_id: string; 
    name?: string; 
    item_name?: string;
    size?: string; 
    quantity: number; 
    price: number 
  }>;
  total: number;
  status: string;
  created_at: string;
  location_name?: string;
  location_city_state?: string;
}

export interface LoginResponse {
  token: string;
  member_id: string;
  first_name?: string;
  last_name?: string;
}
