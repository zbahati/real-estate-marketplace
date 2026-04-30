import api from '../services/api';
import type { Listing } from '../types';

const toListingArray = (payload: any): Listing[] => {
  const out = payload && payload.data !== undefined ? payload.data : payload;
  return Array.isArray(out) ? out : (out ? [out] : []);
};

export async function getFavorites(): Promise<Listing[]> {
  try {
    const res = await api.get('/favorites');
    return toListingArray(res.data);
  } catch (err) {
    console.error('getFavorites error', err);
    throw err;
  }
}

export async function addFavorite(listingId: number): Promise<boolean> {
  try {
    const res = await api.post('/favorites', { listing_id: listingId });
    return res.status === 201;
  } catch (err) {
    console.error('addFavorite error', err);
    throw err;
  }
}

export async function removeFavorite(listingId: number): Promise<void> {
  try {
    await api.delete(`/favorites/${listingId}`);
  } catch (err) {
    console.error('removeFavorite error', err);
    throw err;
  }
}

export default { getFavorites, addFavorite, removeFavorite };
