// الصورة الافتراضية لمتجر أو منتج بلا صورة: رمز تعبيري كبير على خلفية ملوّنة.
// الرمز يُختار من الاسم ("برجر لحم" ← 🍔). إن لم يُعرف الاسم جرّبنا التلميح
// (اسم المتجر ووصفه وتصنيفه)، فيأخذ منتج غير معروف في صيدلية رمز الصيدلية.
import { tiles } from '@/theme';

export type DefaultImage = { emoji: string; background: string };

// القواعد بالترتيب: أول كلمة موجودة في النص تفوز، فالأخصّ يسبق الأعمّ
// ("معجون أسنان" قبل "معجون"، و"بيتزا تونة" تأخذ البيتزا لأن البيتزا قبل التونة).
const rules: [words: string[], image: DefaultImage][] = [
  [['برجر', 'برغر'], { emoji: '🍔', background: tiles.warm }],
  [['بيتزا'], { emoji: '🍕', background: tiles.red }],
  [['بطاط'], { emoji: '🍟', background: tiles.yellow }],
  [['شاورما', 'ساندوتش', 'سندويش'], { emoji: '🌯', background: tiles.warm }],
  [['دجاج'], { emoji: '🍗', background: tiles.warm }],
  [['غازي', 'مشروب', 'عصير', 'كولا'], { emoji: '🥤', background: tiles.blue }],
  [['ماء', 'مياه'], { emoji: '💧', background: tiles.blue }],
  [['قهوة', 'شاي'], { emoji: '☕', background: tiles.yellow }],
  [['حليب'], { emoji: '🥛', background: tiles.blue }],
  [['زبادي', 'لبن'], { emoji: '🥣', background: tiles.blue }],
  [['جبن'], { emoji: '🧀', background: tiles.yellow }],
  [['بيض'], { emoji: '🥚', background: tiles.yellow }],
  [['تونة', 'سمك'], { emoji: '🐟', background: tiles.blue }],
  [['أسنان'], { emoji: '🦷', background: tiles.green }],
  [['طماطم'], { emoji: '🍅', background: tiles.red }],
  [['شامبو', 'معقم', 'كريم'], { emoji: '🧴', background: tiles.purple }],
  [['صابون'], { emoji: '🧼', background: tiles.purple }],
  [['كمام'], { emoji: '😷', background: tiles.green }],
  [['حلو', 'كيك', 'كعك'], { emoji: '🍰', background: tiles.red }],
  [['خبز', 'مخبز', 'مخبوز'], { emoji: '🥖', background: tiles.yellow }],
  [['معلب', 'معجون'], { emoji: '🥫', background: tiles.red }],
  [['خضار', 'خضروات', 'فواكه'], { emoji: '🥬', background: tiles.green }],
  // أنواع المتاجر
  [['صيدلي', 'دواء', 'أدوية'], { emoji: '💊', background: tiles.green }],
  [['سوق', 'غذائ', 'بقال', 'ماركت'], { emoji: '🛒', background: tiles.green }],
  [['مطعم', 'مشوي', 'وجبات'], { emoji: '🍽️', background: tiles.warm }],
];

const fallback: DefaultImage = { emoji: '🛍️', background: tiles.neutral };

function match(text: string): DefaultImage | undefined {
  return rules.find(([words]) => words.some((w) => text.includes(w)))?.[1];
}

export function defaultImage(name: string, hint = ''): DefaultImage {
  return match(name) ?? match(hint) ?? fallback;
}
