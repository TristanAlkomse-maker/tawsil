-- اختبارات الصلاحيات (RLS): من يرى ماذا ومن يكتب ماذا.
-- كل الملف داخل معاملة (begin ... rollback): لا شيء مما ينشئه الاختبار يبقى في القاعدة.
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

-- ---------- التجهيز (بصلاحيات المالك postgres) ----------

-- ثلاثة مستخدمين: (أ) و (ب) عميلان، و (ج) سيصبح مديرًا.
-- الإدخال في auth.users يحاكي إنشاء حساب، فيشغّل handle_new_user تلقائيًا.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '218910000001@phone.tawsil.app',
   '{"full_name": "العميل أ", "phone": "+218910000001"}'),
  ('00000000-0000-0000-0000-00000000000b', '218910000002@phone.tawsil.app',
   '{"full_name": "العميل ب", "phone": "+218910000002"}'),
  ('00000000-0000-0000-0000-00000000000c', '218910000003@phone.tawsil.app',
   '{"full_name": "المدير ج", "phone": "+218910000003"}');

select is(
  (select full_name || ' | ' || phone || ' | ' || role from public.profiles
    where id = '00000000-0000-0000-0000-00000000000a'),
  'العميل أ | +218910000001 | customer',
  'handle_new_user تنشئ صف profiles بالاسم والهاتف والدور customer');

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000c';

insert into public.addresses (id, user_id, label, zone_id, description) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'البيت',
   (select id from public.zones where name_ar = 'عين زارة'), 'عنوان العميل أ'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000b', 'البيت',
   (select id from public.zones where name_ar = 'الهضبة'), 'عنوان العميل ب');

-- منطقة موقوفة، ومتجر غير معتمد فيه قسم ومنتج
insert into public.zones (name_ar, delivery_fee, sort_order, is_active)
  values ('منطقة موقوفة', 30.00, 99, false);

insert into public.stores (id, category_id, name_ar, zone_id, is_active) values
  ('00000000-0000-0000-0000-0000000000d1',
   (select id from public.store_categories limit 1), 'متجر غير معتمد',
   (select id from public.zones where name_ar = 'عين زارة'), false);
insert into public.menu_sections (id, store_id, name_ar) values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d1', 'قسم');
insert into public.products (store_id, section_id, name_ar, price) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2', 'منتج مخفي', 5.00);

-- طلب يخص العميل ب
insert into public.orders
  (id, customer_id, store_id, subtotal, delivery_fee, total,
   customer_name, customer_phone, zone_name, address_description)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b',
   (select id from public.stores where is_active limit 1), 30.00, 20.00, 50.00,
   'العميل ب', '+218910000002', 'الهضبة', 'عنوان العميل ب');

select is(
  (select count(*) from pg_class
    where relnamespace = 'public'::regnamespace and relkind = 'r' and relrowsecurity),
  12::bigint,
  'RLS مفعّلة على الجداول الاثني عشر كلها');

-- ---------- الزائر (بلا حساب) ----------
set local role anon;

select is((select count(*) from public.stores), 4::bigint,
  'الزائر يرى المتاجر الأربعة المعتمدة فقط');

select is((select count(*) from public.stores where not is_active), 0::bigint,
  'الزائر لا يرى المتجر غير المعتمد');

select is((select count(*) from public.products where name_ar = 'منتج مخفي'), 0::bigint,
  'الزائر لا يرى منتجات متجر غير معتمد');

select is((select count(*) from public.menu_sections
            where store_id = '00000000-0000-0000-0000-0000000000d1'), 0::bigint,
  'الزائر لا يرى أقسام متجر غير معتمد');

select is((select count(*) from public.zones), 9::bigint,
  'الزائر يرى المناطق النشطة فقط');

select throws_ok($$ select * from public.profiles $$, '42501', null,
  'الزائر لا يقرأ profiles');

select throws_ok($$ select * from public.orders $$, '42501', null,
  'الزائر لا يقرأ orders');

select throws_ok(
  $$ update public.stores set is_open = false $$, '42501', null,
  'الزائر لا يعدّل المتاجر');

-- ---------- العميل أ ----------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select results_eq(
  $$ select description from public.addresses $$,
  $$ values ('عنوان العميل أ'::text) $$,
  'العميل يرى عناوينه فقط، ولا يرى عنوان غيره');

select throws_ok(
  $$ insert into public.addresses (user_id, label, zone_id, description)
     values ('00000000-0000-0000-0000-00000000000b', 'دخيل',
             (select id from public.zones limit 1), 'عنوان باسم غيره') $$,
  '42501', null,
  'العميل لا يضيف عنوانًا باسم مستخدم آخر');

select results_eq(
  $$ select full_name from public.profiles $$,
  $$ values ('العميل أ'::text) $$,
  'العميل يرى صفّه فقط في profiles');

select lives_ok(
  $$ update public.profiles set full_name = 'اسم جديد'
      where id = '00000000-0000-0000-0000-00000000000a' $$,
  'العميل يغيّر اسمه');

select throws_ok(
  $$ update public.profiles set role = 'admin'
      where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null,
  'العميل لا يغيّر دوره');

select throws_ok(
  $$ update public.profiles set phone = '+218919999999'
      where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null,
  'العميل لا يغيّر هاتفه');

select throws_ok(
  $$ insert into public.orders
       (customer_id, store_id, subtotal, delivery_fee, total,
        customer_name, customer_phone, zone_name, address_description)
     values ('00000000-0000-0000-0000-00000000000a',
             (select id from public.stores limit 1), 1.00, 0.00, 1.00,
             'العميل أ', '+218910000001', 'عين زارة', 'وصف') $$,
  '42501', null,
  'العميل لا يكتب في orders مباشرة');

select is((select count(*) from public.orders), 0::bigint,
  'العميل لا يرى طلبات عميل آخر');

-- المحاولة لا تعطي خطأ، لكن RLS تجعلها لا تمس أي صف
update public.zones set delivery_fee = 0;
select is((select delivery_fee from public.zones where name_ar = 'عين زارة'), 10.00::numeric,
  'العميل لا يغيّر رسوم المناطق');

-- ---------- المدير ج ----------
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';

-- نعدّ صفوف الاختبار فقط: القاعدة الحقيقية قد يكون فيها حسابات وطلبات أخرى
select is((select count(*) from public.profiles where id in (
            '00000000-0000-0000-0000-00000000000a',
            '00000000-0000-0000-0000-00000000000b',
            '00000000-0000-0000-0000-00000000000c')), 3::bigint,
  'المدير يقرأ كل الحسابات');

select is((select count(*) from public.orders
            where id = '00000000-0000-0000-0000-0000000000b1'), 1::bigint,
  'المدير يقرأ كل الطلبات، ومنها طلب العميل ب');

update public.zones set delivery_fee = 12.00 where name_ar = 'عين زارة';
select is((select delivery_fee from public.zones where name_ar = 'عين زارة'), 12.00::numeric,
  'المدير يعدّل رسوم المناطق');

select * from finish();
rollback;
