// حالات الطلب كما في القسم 4 من المواصفات، وكيف تظهر في شريط المراحل.
import i18n from '@/i18n';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

// المراحل الخمس التي يراها العميل بالترتيب. مرفوض وملغي ليسا مراحل:
// شاشة التتبع تستبدل الشريط برسالة واحدة عندهما.
export const STAGES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'on_the_way', 'delivered'];

// الاسم العربي من ar.json، حتى تبقى كل النصوص في ملف الترجمة
export function statusLabel(status: OrderStatus): string {
  return i18n.t(`status.${status}`);
}

// حال مرحلة واحدة في الشريط عندما يكون الطلب في حالة معينة
export function stageState(stage: OrderStatus, status: OrderStatus): 'done' | 'current' | 'upcoming' {
  if (status === 'delivered') return 'done'; // الطلب انتهى، فكل المراحل منجزة
  const diff = STAGES.indexOf(stage) - STAGES.indexOf(status);
  if (diff < 0) return 'done';
  if (diff === 0) return 'current';
  return 'upcoming';
}

// الحالات التي يستطيع المدير نقل الطلب إليها: نفس جدول القسم 4 ونفس قائمة set_order_status.
// صفحة الإدارة تعرض زرًا لكل واحدة فقط. الحالات النهائية غير موجودة هنا، فلا أزرار لها.
const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
};

export function adminTransitions(status: OrderStatus): OrderStatus[] {
  return ADMIN_TRANSITIONS[status] ?? [];
}

// نشط = لم يصل بعد إلى حالة نهائية. يُستخدم لتقسيم تبويب طلباتي.
export function isActive(status: OrderStatus): boolean {
  return !['delivered', 'rejected', 'cancelled'].includes(status);
}
