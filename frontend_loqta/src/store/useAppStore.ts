import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, dictionary, TranslationKey } from '../lib/i18n';
import { authService, cartService, favoriteService, setToken } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import type { Product } from '../data/demoProducts';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface CartItem {
  /** Backend cart-item id — only present for synced (logged-in) baskets. */
  itemId?: string;
  /** Product id */
  id: string;
  quantity: number;
  product?: Product;
}

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;

  user: User | null;
  setUser: (user: User | null) => Promise<void>;
  initAuth: () => Promise<void>;

  favorites: string[];
  toggleFavorite: (id: string) => void;

  cart: CartItem[];
  addToCart: (id: string, product?: Product) => void;
  decreaseQuantity: (id: string) => void;
  removeFromCart: (id: string) => void;
}

/** Demo ids only exist on the frontend and must never hit the backend. */
const isDemoId = (id: string) => id.startsWith('demo-');

function mapCartFromApi(payload: any): CartItem[] {
  return (payload?.items ?? [])
    .map((item: any) => ({
      itemId: item.id as string,
      id: item.product?.id as string,
      quantity: item.quantity as number,
      product: item.product ? mapBackendProduct(item.product) : undefined,
    }))
    .filter((item: CartItem) => Boolean(item.id));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => dictionary[get().language][key],

      user: null,
      setUser: async (user) => {
        // Normalize: ensure we store the user object
        set({ user });
        if (!user) {
          // Session ended — drop server favorites/cart copies.
          set({ favorites: [], cart: [] });
          return;
        }
        try {
          // Merge guest-basket items into the user's server basket.
          const guestItems = get().cart.filter((item) => !item.itemId && !isDemoId(item.id));
          for (const item of guestItems) {
            try {
              await cartService.addItem(item.id, item.quantity);
            } catch {
              // Out of stock / merged already — keep syncing the rest.
            }
          }
          const [cartResponse, favoritesResponse] = await Promise.all([
            cartService.get(),
            favoriteService.list({ page: 1, pageSize: 100 }),
          ]);
          set({
            cart: mapCartFromApi(cartResponse.data),
            favorites: (favoritesResponse.data ?? []).map((p: any) => p.id),
          });
        } catch {
          // Basket/favorites will sync on the next action.
        }
      },
      initAuth: async () => {
        try {
          const response = await authService.me();
          // response may be wrapped as { data: user } by backend
          const userData: any = (response as any).data?.data ?? (response as any).data ?? response;
          await get().setUser(userData);
        } catch {
          // No valid session — drop any stale token.
          setToken(null);
          set({ user: null });
        }
      },

      favorites: [],
      toggleFavorite: async (id) => {
        const { user, favorites } = get();
        const isFavorite = favorites.includes(id);

        if (user && !isDemoId(id)) {
          try {
            if (isFavorite) await favoriteService.remove(id);
            else await favoriteService.add(id);
          } catch {
            // Keep the UI responsive even if the request fails.
          }
        }
        set((state) => ({
          favorites: isFavorite
            ? state.favorites.filter((fid) => fid !== id)
            : [...state.favorites, id]
        }));
      },

      cart: [],
      addToCart: async (id, product) => {
        if (get().user && !isDemoId(id)) {
          try {
            const response = await cartService.addItem(id);
            set({ cart: mapCartFromApi(response.data) });
            return;
          } catch {
            // Fall back to the local basket on failure.
          }
        }
        set((state) => {
          const existing = state.cart.find(item => item.id === id);
          if (existing) {
            return {
              cart: state.cart.map(item =>
                item.id === id
                  ? { ...item, quantity: item.quantity + 1, product: item.product ?? product }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { id, quantity: 1, product }] };
        });
      },
      decreaseQuantity: async (id) => {
        const { user, cart } = get();
        if (user) {
          const entry = cart.find(item => item.id === id);
          if (entry?.itemId) {
            try {
              const response = entry.quantity > 1
                ? await cartService.updateItem(entry.itemId, entry.quantity - 1)
                : await cartService.removeItem(entry.itemId);
              set({ cart: mapCartFromApi(response.data) });
              return;
            } catch {
              // Fall back to the local basket on failure.
            }
          }
        }
        set((state) => {
          const existing = state.cart.find(item => item.id === id);
          if (existing && existing.quantity > 1) {
            return { cart: state.cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item) };
          }
          return { cart: state.cart.filter(item => item.id !== id) };
        });
      },
      removeFromCart: async (id) => {
        const { user, cart } = get();
        if (user) {
          const entry = cart.find(item => item.id === id);
          if (entry?.itemId) {
            try {
              const response = await cartService.removeItem(entry.itemId);
              set({ cart: mapCartFromApi(response.data) });
              return;
            } catch {
              // Fall back to the local basket on failure.
            }
          }
        }
        set((state) => ({
          cart: state.cart.filter(item => item.id !== id)
        }));
      },
    }),
    {
      name: 'loqta-storage',
      partialize: (state) => ({ language: state.language, favorites: state.favorites, cart: state.cart }),
    }
  )
);
