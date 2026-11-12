// العنوان الذي يظهر أعلى الرئيسية: الافتراضي، وإن لم يوجد فأول عنوان.
// "اختيار" عنوان في شاشة عناويني يجعله الافتراضي (عمود is_default في جدول addresses).
export function selectedAddress<T extends { is_default: boolean }>(addresses: T[]): T | null {
  return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
}
