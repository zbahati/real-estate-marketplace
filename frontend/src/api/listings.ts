import api from '../services/api';
import type { Listing, ApiResponse } from '../types';

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
  const radius = options?.radius ?? 500;
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
    } catch (e) {
      // ignore logging errors
    }

    // Backend sometimes returns the raw array (e.g. `[...]`) and
    // sometimes a wrapped object `{ success, data }`.
    // Support both shapes: prefer `res.data.data` if present,
    // otherwise return `res.data` directly.
    const payload = res.data;
    const out = payload && payload.data !== undefined ? payload.data : payload;
    // Ensure we always return an array
    return Array.isArray(out) ? out : (out ? [out] : []);
  } catch (err) {
    console.error('getNearbyListings error', err);
    throw err;
  }
}

export default { getNearbyListings };
