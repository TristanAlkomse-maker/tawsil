import AsyncStorage from '@react-native-async-storage/async-storage';

import { cartCount, cartSubtotal, useCart } from './cart';

// في الاختبار لا يوجد هاتف، فنستخدم نسخة وهمية من AsyncStorage تحفظ في الذاكرة.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const burgerShop = { id: 'store-1', name: 'برجر الميدان', minOrder: 15 };
const pizzaShop = { id: 'store-2', name: 'بيتزا طرابلس', minOrder: 20 };
const burger = { id: 'p-1', name: 'برجر لحم كلاسيك', price: 18 };
const chicken = { id: 'p-2', name: 'برجر دجاج مقرمش', price: 16 };
const pizza = { id: 'p-3', name: 'بيتزا مارغريتا', price: 22 };

// كل اختبار يبدأ بسلة فارغة
beforeEach(() => useCart.getState().clear());

describe('السلة', () => {
  it('تضيف منتجًا وتحفظ المتجر', () => {
    useCart.getState().add(burgerShop, burger, 2);

    const { store, items } = useCart.getState();
    expect(store).toEqual(burgerShop);
    expect(items).toEqual([{ ...burger, quantity: 2 }]);
  });

  it('تزيد كمية منتج موجود بدل تكراره', () => {
    useCart.getState().add(burgerShop, burger, 1);
    useCart.getState().add(burgerShop, burger, 2);
    useCart.getState().increase(burger.id);

    expect(useCart.getState().items).toEqual([{ ...burger, quantity: 4 }]);
  });

  it('تنقص الكمية، وتحذف المنتج عند الصفر', () => {
    useCart.getState().add(burgerShop, burger, 2);
    useCart.getState().add(burgerShop, chicken, 1);

    useCart.getState().decrease(burger.id);
    expect(useCart.getState().items[0].quantity).toBe(1);

    useCart.getState().decrease(burger.id);
    expect(useCart.getState().items).toEqual([{ ...chicken, quantity: 1 }]);
  });

  it('تنسى المتجر عندما تفرغ، فيمكن البدء من متجر آخر', () => {
    useCart.getState().add(burgerShop, burger, 1);
    useCart.getState().decrease(burger.id);

    expect(useCart.getState().store).toBeNull();
    expect(useCart.getState().add(pizzaShop, pizza, 1)).toBe(true);
  });

  it('تحسب المجموع وعدد القطع', () => {
    useCart.getState().add(burgerShop, burger, 2); // 36
    useCart.getState().add(burgerShop, { id: 'p-4', name: 'عصير', price: 3.25 }, 3); // 9.75

    const { items } = useCart.getState();
    expect(cartSubtotal(items)).toBe(45.75);
    expect(cartCount(items)).toBe(5);
  });

  it('لا تتجاوز الكمية 99', () => {
    useCart.getState().add(burgerShop, burger, 98);
    useCart.getState().add(burgerShop, burger, 5);
    useCart.getState().increase(burger.id);

    expect(useCart.getState().items[0].quantity).toBe(99);
  });

  it('ترفض منتجًا من متجر ثانٍ ولا تغيّر شيئًا', () => {
    useCart.getState().add(burgerShop, burger, 1);

    const added = useCart.getState().add(pizzaShop, pizza, 1);

    expect(added).toBe(false);
    expect(useCart.getState().store).toEqual(burgerShop);
    expect(useCart.getState().items).toEqual([{ ...burger, quantity: 1 }]);
  });

  it('تُحفظ على الهاتف في AsyncStorage', async () => {
    useCart.getState().add(burgerShop, burger, 1);

    const saved = JSON.parse((await AsyncStorage.getItem('cart'))!);
    expect(saved.state.items).toEqual([{ ...burger, quantity: 1 }]);
  });
});
