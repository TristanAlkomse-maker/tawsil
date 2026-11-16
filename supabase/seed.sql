-- بيانات البداية: المناطق الحقيقية + متاجر ومنتجات تجريبية.
-- المتاجر والمنتجات هنا للتجربة فقط وتُستبدل بالحقيقية لاحقًا.

-- ---------- المناطق (حقيقية) ----------
-- الرسوم بالدينار الليبي، ثابتة لكل منطقة، وتُحسب حسب منطقة العميل.
-- المتجر في عين زارة / طريق المشتل. الحلقتان ج و د تُضافان عند تحديد رسومهما.
insert into public.zones (name_ar, delivery_fee, sort_order, is_active) values
  -- الحلقة أ
  ('عين زارة',     10.00, 1, true),
  ('طريق المشتل',  10.00, 2, true),
  ('الفرناج',      10.00, 3, true),
  ('خلة الفرجان',  10.00, 4, true),
  -- الحلقة ب
  ('صلاح الدين',   20.00, 5, true),
  ('طريق الشوك',   20.00, 6, true),
  ('الهضبة',       20.00, 7, true),
  ('سوق الجمعة',   20.00, 8, true),
  ('وادي الربيع',  20.00, 9, true);

-- ---------- التصنيفات (تجريبية) ----------
insert into public.store_categories (name_ar, name_en, sort_order) values
  ('برجر',   'Burger',   1),
  ('بيتزا',  'Pizza',    2),
  ('الغذائية', 'Grocery', 3),
  ('مخبز',   'Bakery',   4),
  ('صيدلية', 'Pharmacy', 5);

-- ---------- المتاجر (تجريبية، كلها في عين زارة) ----------
-- الصيدلية مغلقة الآن (is_open = false) لتجربة شكل المتجر المغلق.
insert into public.stores
  (category_id, name_ar, description_ar, zone_id, phone, min_order, prep_minutes, is_open)
select c.id, s.name_ar, s.description_ar, z.id, s.phone, s.min_order, s.prep_minutes, s.is_open
  from (values
    ('برجر',   'برجر المشتل',    'برجر مشوي على الفحم',   '+218910000101', 15.00, 20, true),
    ('بيتزا',  'بيتزا الفرن',    'بيتزا بعجينة طازجة',     '+218910000102', 20.00, 25, true),
    ('الغذائية', 'سوق مرمرة',    'كل ما يحتاجه البيت',     '+218910000103', 10.00, 15, true),
    ('صيدلية', 'صيدلية الشفاء',  'أدوية ومستلزمات عناية',  '+218910000104',  0.00, 10, false)
  ) as s (category, name_ar, description_ar, phone, min_order, prep_minutes, is_open)
  join public.store_categories c on c.name_ar = s.category
  join public.zones z on z.name_ar = 'عين زارة';

-- شعارات المتاجر: الصور في Supabase Storage (المخزن stores)، ونسخها الأصلية في supabase/storage/stores/
update public.stores s set logo_url = 'https://ufbvkllhmimdolgxqwkj.supabase.co/storage/v1/object/public/stores/' || v.file
  from (values
    ('برجر المشتل', 'burger-almashtal.webp'),
    ('بيتزا الفرن', 'pizza-alforn.webp'),
    ('سوق مرمرة',  'souq-marmara.webp')
  ) as v (name_ar, file)
 where s.name_ar = v.name_ar;

-- غلاف صفحة المتجر
update public.stores
   set cover_url = 'https://ufbvkllhmimdolgxqwkj.supabase.co/storage/v1/object/public/stores/burger-almashtal-cover.jpg'
 where name_ar = 'برجر المشتل';

-- ---------- أقسام القائمة ----------
insert into public.menu_sections (store_id, name_ar, sort_order)
select st.id, m.name_ar, m.sort_order
  from (values
    ('برجر المشتل',   'وجبات',    1),
    ('برجر المشتل',   'مشروبات',  2),
    ('بيتزا الفرن',   'بيتزا',    1),
    ('بيتزا الفرن',   'مقبلات',   2),
    ('سوق مرمرة',    'ألبان',    1),
    ('سوق مرمرة',    'معلبات',   2),
    ('صيدلية الشفاء', 'عناية',    1),
    ('صيدلية الشفاء', 'مستلزمات', 2)
  ) as m (store, name_ar, sort_order)
  join public.stores st on st.name_ar = m.store;

-- ---------- المنتجات (20 منتجًا) ----------
-- "برجر حار" غير متوفر (is_available = false) لتجربة شكل المنتج النافد.
insert into public.products (store_id, section_id, name_ar, price, is_available, sort_order)
select st.id, ms.id, p.name_ar, p.price, p.is_available, p.sort_order
  from (values
    ('برجر المشتل',   'وجبات',    'برجر لحم',         18.00, true,  1),
    ('برجر المشتل',   'وجبات',    'برجر دجاج',        16.00, true,  2),
    ('برجر المشتل',   'وجبات',    'برجر حار',         19.50, false, 3),
    ('برجر المشتل',   'مشروبات',  'مشروب غازي',        3.00, true,  1),
    ('برجر المشتل',   'مشروبات',  'ماء',               1.50, true,  2),
    ('بيتزا الفرن',   'بيتزا',    'بيتزا مارغريتا',   22.00, true,  1),
    ('بيتزا الفرن',   'بيتزا',    'بيتزا خضار',       25.00, true,  2),
    ('بيتزا الفرن',   'بيتزا',    'بيتزا تونة',       28.00, true,  3),
    ('بيتزا الفرن',   'مقبلات',   'بطاطا مقلية',       8.00, true,  1),
    ('بيتزا الفرن',   'مقبلات',   'خبز بالثوم',        6.50, true,  2),
    ('سوق مرمرة',    'ألبان',    'حليب 1 لتر',        4.50, true,  1),
    ('سوق مرمرة',    'ألبان',    'زبادي',             2.25, true,  2),
    ('سوق مرمرة',    'ألبان',    'جبنة',              9.00, true,  3),
    ('سوق مرمرة',    'معلبات',   'تونة',              7.50, true,  1),
    ('سوق مرمرة',    'معلبات',   'طماطم معجون',       3.75, true,  2),
    ('صيدلية الشفاء', 'عناية',    'شامبو',            14.00, true,  1),
    ('صيدلية الشفاء', 'عناية',    'معجون أسنان',       6.00, true,  2),
    ('صيدلية الشفاء', 'عناية',    'صابون',             2.50, true,  3),
    ('صيدلية الشفاء', 'مستلزمات', 'كمامات (علبة)',    12.00, true,  1),
    ('صيدلية الشفاء', 'مستلزمات', 'معقم يدين',         5.00, true,  2)
  ) as p (store, section, name_ar, price, is_available, sort_order)
  join public.stores st on st.name_ar = p.store
  join public.menu_sections ms on ms.store_id = st.id and ms.name_ar = p.section;
