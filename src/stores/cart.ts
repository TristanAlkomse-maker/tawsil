// السلة: منتجات من متجر واحد فقط، محفوظة على الهاتف فتبقى بعد إغلاق التطبيق.
// Zustand يحفظ الحالة في الذاكرة، و persist ينسخها إلى AsyncStorage بعد كل تغيير.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Alert } from 'react-native';

import i18n from '@/i18n';
import { MAX_QUANTITY } from '@/lib/quantity';

export type CartStore = { id: string; name: string; minOrder: number };
export type CartProduct = { id: string; name: string; price: number };
export type CartItem = CartProduct & { quantity: number };

type CartState = {
  store: CartStore | null; // null = السلة فارغة
  items: CartItem[];
  // تعيد false إذا كان المنتج من متجر غير متجر السلة، ولا تغيّر شيئًا
  add: (store: CartStore, product: CartProduct, quantity: number) => boolean;
  increase: (productId: string) => void;
  decrease: (productId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      store: null,
      items: [],

      add(store, product, quantity) {
        const current = get();
        if (current.store && current.store.id !== store.id) return false;

        const existing = current.items.find((i) => i.id === product.id);
        const items = existing
          ? current.items.map((i) =>
              i.id === product.id ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i,
            )
          : [...current.items, { ...product, quantity: Math.min(MAX_QUANTITY, quantity) }];

        set({ store, items });
        return true;
      },

      increase(productId) {
        set({
          items: get().items.map((i) =>
            i.id === productId ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + 1) } : i,
          ),
        });
      },

      decrease(productId) {
        const items = get()
          .items.map((i) => (i.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0);
        // عندما تفرغ السلة ننسى المتجر، فيمكن البدء من أي متجر
        set({ items, store: items.length > 0 ? get().store : null });
      },

      clear() {
        set({ store: null, items: [] });
      },
    }),
    { name: 'cart', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// مجموع المنتجات بالدينار. التقريب لمنزلتين يمنع أخطاء الكسور مثل 0.1 + 0.2.
// هذا للعرض فقط؛ الإجمالي الحقيقي تحسبه create_order في قاعدة البيانات.
export function cartSubtotal(items: CartItem[]): number {
  const sum = items.reduce((total, i) => total + i.price * i.quantity, 0);
  return Math.round(sum * 100) / 100;
}

// يُستدعى من زر الإضافة في الشاشات. إذا كانت السلة من متجر آخر يسأل العميل:
// هل يفرغها ويبدأ من جديد؟ (القسم 6 من المواصفات)
export function addToCart(store: CartStore, product: CartProduct, quantity: number) {
  const { add, clear } = useCart.getState();
  if (add(store, product, quantity)) return;

  Alert.alert(i18n.t('cart.otherStoreTitle'), i18n.t('cart.otherStoreMessage'), [
    { text: i18n.t('cart.cancel'), style: 'cancel' },
    {
      text: i18n.t('cart.emptyAndAdd'),
      style: 'destructive',
      onPress: () => {
        clear();
        add(store, product, quantity);
      },
    },
  ]);
}

// عدد القطع، لزر "عرض السلة (2)"
export function cartCount(items: CartItem[]): number {
  return items.reduce((total, i) => total + i.quantity, 0);
}
