// أرقام الهاتف الليبية: توحيد الصيغة وتوليد معرّف الدخول الداخلي.

// يقبل 0912345678 أو 912345678 أو +218912345678 (ولو بمسافات)
// ويعيد الصيغة الموحّدة +218912345678، أو null إذا كان الرقم غير صالح.
export function normalizePhone(input: string): string | null {
  const match = input.replace(/\s/g, '').match(/^(?:\+218|0)?(9\d{8})$/);
  return match ? `+218${match[1]}` : null;
}

// Supabase يدخل بالبريد لا بالهاتف (القسم 2 من المواصفات)، فنصنع من الرقم
// الموحّد "بريدًا" داخليًا لا يراه العميل أبدًا: 218912345678@phone.tawsil.app
export function phoneToEmail(phone: string): string {
  return `${phone.slice(1)}@phone.tawsil.app`;
}
