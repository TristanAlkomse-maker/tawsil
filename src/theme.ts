// كل ألوان وخطوط التطبيق في مكان واحد (القسم 7 من المواصفات).
// أي شاشة تحتاج لونًا تأخذه من هنا ولا تكتب الرمز مباشرة.
export const colors = {
  primary: '#F26B1D', // الأزرار الرئيسية والعناصر النشطة
  primaryDark: '#C2410C', // النص البرتقالي على الخلفيات الفاتحة
  background: '#F7F5F2', // خلفية كل الشاشات (رمادي دافئ يليق بالبرتقالي)
  surface: '#FFFFFF', // البطاقات والحقول
  border: '#ECE8E3', // الفواصل وإطارات الحقول
  text: '#1F2937', // العناوين والأسعار ونص الأزرار البرتقالية
  textSecondary: '#5B6472', // الأوصاف والتسميات
  success: '#15803D', // تم التسليم، مفتوح
  danger: '#DC2626', // الأخطاء، مرفوض، ملغي
  // درجات من ملف التصميم: وسما مفتوح/مغلق وخلفية الصورة قبل تحميلها
  successSoft: '#DCFCE7', // خلفية وسم مفتوح
  dangerSoft: '#FEE2E2', // خلفية وسم مغلق
  dangerDark: '#B91C1C', // نص مغلق ونفد (أوضح من الأحمر العادي على الخلفية الوردية)
  placeholder: '#EDEAE6', // مكان الصورة قبل تحميلها أو إن لم توجد
  // درجات شريط مراحل الطلب في شاشة التتبع (من ملف التصميم)
  primarySoft: '#FCD9C2', // الهالة حول المرحلة الحالية
  stepIdle: '#C5CAD3', // دوائر وخطوط المراحل القادمة
  // خلفية برتقالية خفيفة جدًا: دوائر الأيقونات والوسوم النشطة والبطاقة المختارة
  primaryTint: '#FFF1E7',
  neutralSoft: '#EFEDEA', // خلفية الوسوم المحايدة وأزرار العدّاد
};

// خلفيات الصور الافتراضية للمتاجر والمنتجات (src/lib/defaultImage.ts)
export const tiles = {
  warm: '#FFE4CF', // برجر ومشويات
  red: '#FFE1DC', // بيتزا وطماطم وحلويات
  yellow: '#FFF0C7', // مخبوزات وأجبان
  blue: '#DCEEFB', // مشروبات وألبان
  green: '#DDF3E6', // صيدلية وبقالة وخضار
  purple: '#EBE5FA', // عناية شخصية
  neutral: '#EDEAE6', // ما لا نعرف نوعه
};

// أسماء الخط كما تُحمَّل في app/_layout.tsx
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  bold: 'IBMPlexSansArabic_700Bold',
};

// استدارة الزوايا: رقم واحد لكل نوع عنصر حتى تتشابه الشاشات
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

// الظلال بدل الإطارات: البطاقة تطفو قليلًا فوق الخلفية
export const shadows = {
  card: { boxShadow: '0 2px 10px rgba(31, 41, 55, 0.06)' },
  raised: { boxShadow: '0 8px 24px rgba(31, 41, 55, 0.14)' },
  primary: { boxShadow: '0 6px 16px rgba(242, 107, 29, 0.32)' }, // توهج تحت الزر البرتقالي
} as const;

// شكل البطاقة المشترك بين كل الشاشات
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: 16,
  ...shadows.card,
} as const;
