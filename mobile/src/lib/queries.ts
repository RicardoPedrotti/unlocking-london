import { useQuery } from '@tanstack/react-query';
import { getCategories, getOccasions, getPlace, getPlaces } from './api';

// The BFF returns already-normalized shapes (M2M flattened server-side), so the
// app just fetches and caches. The map + discover both read the places cache.

export function usePlaces() {
  return useQuery({ queryKey: ['places'], queryFn: getPlaces, staleTime: 5 * 60_000 });
}

export function usePlace(id?: string) {
  return useQuery({ queryKey: ['place', id], enabled: !!id, queryFn: () => getPlace(id!) });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 30 * 60_000 });
}

export function useOccasions() {
  return useQuery({ queryKey: ['occasions'], queryFn: getOccasions, staleTime: 30 * 60_000 });
}
