// يحوّل مبلغًا بالدينار إلى النص الذي يراه العميل، مثل: 12.50 د.ل
export function formatMoney(amount: number): string {
  return `${amount.toFixed(2)} د.ل`;
}
