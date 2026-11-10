// عدّاد الكمية في تفاصيل المنتج: يزيد أو ينقص واحدًا، ويبقى بين 1 و 99
// (نفس حدود الكمية التي تقبلها دالة create_order في قاعدة البيانات).
export const MAX_QUANTITY = 99;

export function stepQuantity(current: number, delta: number): number {
  return Math.min(MAX_QUANTITY, Math.max(1, current + delta));
}
