import api from '../services/api';
import type { Listing } from '../types';

type ListingQueryOptions = {
  limit?: number;
  q?: string;
  listing_type?: string;
  category?: string;
};

const toListingArray = (payload: any): Listing[] => {
  const out = payload && payload.data !== undefined ? payload.data : payload;
  return Array.isArray(out) ? out : (out ? [out] : []);
};

export async function getListings(options?: ListingQueryOptions): Promise<Listing[]> {
  const limit = options?.limit ?? 50;

  try {
    const params: any = { limit };
    if (options?.q) params.q = options.q;
    if (options?.listing_type) params.listing_type = options.listing_type;
    if (options?.category) params.category = options.category;

    const res = await api.get<any>('/listings', {
      params,
    });

    return toListingArray(res.data);
  } catch (err) {
    console.error('getListings error', err);
    throw err;
  }
}

export async function getNearbyListings(options?: {
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  q?: string;
  listing_type?: string;
  category?: string;
}): Promise<Listing[]> {
  const lat = options?.lat;
  const lng = options?.lng;
  const radius = options?.radius ?? 50;
  const limit = options?.limit ?? 20;

  try {
    const params: any = { radius, limit };
    if (lat !== undefined) params.lat = lat;
    if (lng !== undefined) params.lng = lng;
    if (options?.q) params.q = options.q;
    if (options?.listing_type) params.listing_type = options.listing_type;
    if (options?.category) params.category = options.category;

    const res = await api.get<any>('/listings/nearby', {
      params,
    });

    // Debugging: log response shape so we can spot mismatches
    try {
      console.log('[getNearbyListings] baseURL=', (api as any).defaults?.baseURL, 'status=', res.status);
      console.log('[getNearbyListings] response.data=', JSON.stringify(res.data).slice(0, 2000));
    } catch {
      // ignore logging errors
    }

    // Backend sometimes returns the raw array (e.g. `[...]`) and
    // sometimes a wrapped object `{ success, data }`.
    // Support both shapes: prefer `res.data.data` if present,
    // otherwise return `res.data` directly.
    return toListingArray(res.data);
  } catch (err) {
    console.error('getNearbyListings error', err);
    throw err;
  }
}

export default { getListings, getNearbyListings };
