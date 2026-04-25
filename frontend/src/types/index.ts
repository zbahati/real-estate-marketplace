export interface User {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
}

export interface Image {
  id: number;
  url: string;
  listing_id?: number;
}

export interface Location {
  id: number;
  name?: string;
  lat: number;
  lng: number;
}

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price?: number;
  lat: number;
  lng: number;
  images?: Image[];
  location_id?: number;
  created_at?: string;
  listing_type?: string;
  category?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  distance?: number; 
}

export interface Favorite {
  id: number;
  user_id: number;
  listing_id: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}
