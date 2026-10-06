import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDoc } from './types';
import { days } from './util';

export interface Filters {
  q: string;
  status: 'all' | 'available' | 'full';
  size: 'all' | 's' | 'm' | 'l';
  date: string;
  sort: 'default' | 'name' | 'free' | 'seats';
  favOnly: boolean;
}
const initialFilters = (): Filters => ({ q: '', status: 'all', size: 'all', date: days(1)[0].key, sort: 'default', favOnly: false });

interface App {
  user: UserDoc | null;
  setUser: (u: UserDoc | null) => void;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  /** favourite room ids — persisted on the device */
  favs: string[];
  toggleFav: (roomId: string) => void;
}

export const useApp = create<App>()(persist(
  set => ({
    user: null,
    setUser: user => set({ user }),
    filters: initialFilters(),
    setFilters: f => set(s => ({ filters: { ...s.filters, ...f } })),
    resetFilters: () => set({ filters: initialFilters() }),
    favs: [],
    toggleFav: id => set(s => ({ favs: s.favs.includes(id) ? s.favs.filter(x => x !== id) : [...s.favs, id] })),
  }),
  { name: 'studyhome-store', storage: createJSONStorage(() => AsyncStorage), partialize: s => ({ favs: s.favs }) },
));
