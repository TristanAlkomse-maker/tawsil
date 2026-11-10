-- اختبارات الدالة create_order: طلب سليم يُحفظ بإجمالي صحيح، ثم رفض لكل شرط من الشروط الستة.
-- كل الملف داخل معاملة (begin ... rollback): لا شيء مما ينشئه الاختبار يبقى في القاعدة.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- ---------- التجهيز (بصلاحيات المالك postgres) ----------
-- نستخدم معرّفات ثابتة حتى نكتبها حرفيًا داخل قائمة المنتجات (JSON).

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '218910000001@phone.tawsil.app',
   '{"full_name": "العميل أ", "phone": "+218910000001"}'),
  ('00000000-0000-0000-0000-00000000000b', '218910000002@phone.tawsil.app',
   '{"full_name": "العميل ب", "phone": "+218910000002"}');

insert into public.zones (id, name_ar, delivery_fee, is_active) values
  ('00000000-0000-0000-0000-0000000000e1', 'منطقة موقوفة', 30.00, false);

-- a1: عنوان العميل أ في صلاح الدين (رسومها 20.00)، a2: عنوانه في المنطقة الموقوفة، b1: عنوان العميل ب
insert into public.addresses (id, user_id, label, zone_id, description, lat, lng) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'البيت',
   (select id from public.zones where name_ar = 'صلاح الدين'), 'قرب الجامع', 32.85, 13.21),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'العمل',
   '00000000-0000-0000-0000-0000000000e1', 'عنوان في منطقة موقوفة', null, null),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'البيت',
   (select id from public.zones where name_ar = 'الهضبة'), 'عنوان العميل ب', null, null);

-- 51: متجر مفتوح حده الأدنى 15.00، 52: متجر مغلق، 53: متجر غير معتمد
insert into public.stores (id, category_id, name_ar, zone_id, min_order, is_open, is_active)
  select s.id, (select id from public.store_categories limit 1), s.name_ar,
         (select id from public.zones where name_ar = 'عين زارة'), s.min_order, s.is_open, s.is_active
  from (values
    ('00000000-0000-0000-0000-000000000051'::uuid, 'متجر الاختبار', 15.00, true,  true),
    ('00000000-0000-0000-0000-000000000052',       'متجر مغلق',      0.00, false, true),
    ('00000000-0000-0000-0000-000000000053',       'متجر غير معتمد', 0.00, true,  false)
  ) as s (id, name_ar, min_order, is_open, is_active);

insert into public.menu_sections (id, store_id, name_ar) values
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051', 'قسم'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000052', 'قسم');

-- 71: وجبة 18.00، 72: مشروب 3.00، 73: منتج نافد، 74: منتج يتبع المتجر 52
insert into public.products (id, store_id, section_id, name_ar, price, is_available) values
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000051',
   '00000000-0000-0000-0000-000000000061', 'وجبة', 18.00, true),
  ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000051',
   '00000000-0000-0000-0000-000000000061', 'مشروب', 3.00, true),
  ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000051',
   '00000000-0000-0000-0000-000000000061', 'منتج نافد', 9.00, false),
  ('00000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000052',
   '00000000-0000-0000-0000-000000000062', 'منتج متجر آخر', 20.00, true);

-- ---------- الشرط 1: المستخدم مسجّل الدخول ----------
set local role anon;

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 1}]', null) $$,
  '42501', null,
  'الشرط 1: الزائر غير المسجّل لا يستدعي create_order');

-- ---------- العميل أ: طلب سليم ----------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

-- وجبتان (18.00 × 2) + مشروب (3.00) = 39.00، والتوصيل إلى صلاح الدين 20.00، فالإجمالي 59.00.
-- نرسل سعرًا مزيفًا 0.01 مع الوجبة: الدالة يجب أن تتجاهله وتقرأ السعر من جدول products.
-- نحفظ المعرّف الذي تعيده الدالة في متغير الجلسة test.order_id لنفحص الطلب به.
select lives_ok(
  $$ select set_config('test.order_id', public.create_order(
       '00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 2, "price": 0.01},
         {"product_id": "00000000-0000-0000-0000-000000000072", "quantity": 1}]',
       'بدون بصل')::text, true) $$,
  'طلب سليم يُقبل والدالة تعيد معرّفه');

select is(
  (select status || ' | ' || subtotal || ' | ' || delivery_fee || ' | ' || total || ' | ' || payment_method
     from public.orders where id = current_setting('test.order_id', true)::uuid),
  'pending | 39.00 | 20.00 | 59.00 | cash',
  'الطلب يُحفظ بحالة pending وإجمالي صحيح محسوب من أسعار القاعدة: 39.00 + 20.00 = 59.00');

select is(
  (select customer_name || ' | ' || customer_phone || ' | ' || zone_name || ' | '
          || address_description || ' | ' || lat || ' | ' || lng || ' | ' || notes
     from public.orders where id = current_setting('test.order_id', true)::uuid),
  'العميل أ | +218910000001 | صلاح الدين | قرب الجامع | 32.85 | 13.21 | بدون بصل',
  'الطلب يحفظ نسخة من اسم العميل وهاتفه وعنوانه وملاحظاته');

select results_eq(
  $$ select product_name, unit_price, quantity, line_total from public.order_items
      where order_id = current_setting('test.order_id', true)::uuid order by unit_price desc $$,
  $$ values ('وجبة'::text, 18.00::numeric(10,2), 2, 36.00::numeric(10,2)),
            ('مشروب',      3.00,                1,  3.00) $$,
  'منتجات الطلب تُحفظ بنسخة من الاسم والسعر ومجموع كل سطر');

select results_eq(
  $$ select status, changed_by from public.order_status_history
      where order_id = current_setting('test.order_id', true)::uuid $$,
  $$ values ('pending'::text, '00000000-0000-0000-0000-00000000000a'::uuid) $$,
  'أول سطر في سجل الحالات: pending باسم العميل');

-- ---------- العميل أ: الرفض ----------

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000053',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 1}]', null) $$,
  'P0001', 'store_unavailable',
  'الشرط 2: متجر غير معتمد يُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000052',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000074", "quantity": 1}]', null) $$,
  'P0001', 'store_closed',
  'الشرط 2: متجر مغلق يُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000b1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 1}]', null) $$,
  'P0001', 'address_not_found',
  'الشرط 3: عنوان يخص عميلًا آخر يُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a2',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 1}]', null) $$,
  'P0001', 'zone_inactive',
  'الشرط 3: عنوان في منطقة موقوفة يُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1', '[]', null) $$,
  'P0001', 'empty_cart',
  'الشرط 4: سلة فارغة تُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 0}]', null) $$,
  'P0001', 'invalid_quantity',
  'الشرط 4: كمية صفر تُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 100}]', null) $$,
  'P0001', 'invalid_quantity',
  'الشرط 4: كمية 100 تُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 1},
         {"product_id": "00000000-0000-0000-0000-000000000074", "quantity": 1}]', null) $$,
  'P0001', 'product_not_in_store',
  'الشرط 5: منتج يتبع متجرًا آخر يُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000071", "quantity": 1},
         {"product_id": "00000000-0000-0000-0000-000000000073", "quantity": 1}]', null) $$,
  'P0001', 'product_unavailable',
  'الشرط 5: منتج نافد يُرفض');

select throws_ok(
  $$ select public.create_order('00000000-0000-0000-0000-000000000051',
       '00000000-0000-0000-0000-0000000000a1',
       '[{"product_id": "00000000-0000-0000-0000-000000000072", "quantity": 4}]', null) $$,
  'P0001', 'below_min_order',
  'الشرط 6: مجموع 12.00 أقل من الحد الأدنى 15.00 يُرفض');

select is(
  (select count(*) from public.orders) || ' | ' || (select count(*) from public.order_items),
  '1 | 2',
  'المحاولات المرفوضة لا تحفظ شيئًا: طلب واحد بمنتجَيه فقط');

select * from finish();
rollback;
