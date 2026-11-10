-- اختبارات الدالة cancel_order: تنجح في حالة pending فقط ولصاحب الطلب فقط.
-- ومعها اختبار تفعيل Realtime على جدول orders.
-- كل الملف داخل معاملة (begin ... rollback): لا شيء مما ينشئه الاختبار يبقى في القاعدة.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

-- ---------- التجهيز (بصلاحيات المالك postgres) ----------

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '218910000001@phone.tawsil.app',
   '{"full_name": "العميل أ", "phone": "+218910000001"}'),
  ('00000000-0000-0000-0000-00000000000b', '218910000002@phone.tawsil.app',
   '{"full_name": "العميل ب", "phone": "+218910000002"}');

-- 01: طلب العميل أ بانتظار القبول، 02: طلبه المقبول، 03: طلب العميل ب بانتظار القبول
insert into public.orders
  (id, status, customer_id, store_id, subtotal, delivery_fee, total,
   customer_name, customer_phone, zone_name, address_description)
  select o.id, o.status, o.customer_id,
         (select id from public.stores limit 1), 30.00, 20.00, 50.00,
         'عميل', '+218910000001', 'الهضبة', 'وصف'
  from (values
    ('00000000-0000-0000-0000-000000000001'::uuid, 'pending',  '00000000-0000-0000-0000-00000000000a'::uuid),
    ('00000000-0000-0000-0000-000000000002',       'accepted', '00000000-0000-0000-0000-00000000000a'),
    ('00000000-0000-0000-0000-000000000003',       'pending',  '00000000-0000-0000-0000-00000000000b')
  ) as o (id, status, customer_id);

-- ---------- Realtime ----------
-- supabase_realtime هي "قائمة النشر" التي يراقبها Realtime: الجدول المضاف إليها تُبث تغييراته.
select is(
  (select string_agg(tablename, ', ') from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'),
  'orders',
  'Realtime مفعّل على جدول orders فقط');

-- ---------- الزائر ----------
set local role anon;

select throws_ok(
  $$ select public.cancel_order('00000000-0000-0000-0000-000000000001') $$,
  '42501', null,
  'الزائر غير المسجّل لا يستدعي cancel_order');

-- ---------- العميل أ ----------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select throws_ok(
  $$ select public.cancel_order('00000000-0000-0000-0000-000000000003') $$,
  'P0001', 'order_not_found',
  'العميل لا يلغي طلب عميل آخر');

select throws_ok(
  $$ select public.cancel_order('00000000-0000-0000-0000-000000000002') $$,
  'P0001', 'order_not_pending',
  'الطلب المقبول لا يلغيه العميل');

select lives_ok(
  $$ select public.cancel_order('00000000-0000-0000-0000-000000000001') $$,
  'العميل يلغي طلبه وهو بانتظار القبول');

select is(
  (select status from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  'cancelled',
  'حالة الطلب أصبحت cancelled');

select results_eq(
  $$ select status, changed_by from public.order_status_history
      where order_id = '00000000-0000-0000-0000-000000000001' $$,
  $$ values ('cancelled'::text, '00000000-0000-0000-0000-00000000000a'::uuid) $$,
  'الإلغاء يُسجَّل في order_status_history باسم العميل');

select throws_ok(
  $$ select public.cancel_order('00000000-0000-0000-0000-000000000001') $$,
  'P0001', 'order_not_pending',
  'الطلب الملغي لا يُلغى مرة ثانية');

-- ---------- بصلاحيات المالك: الطلبان الآخران لم يتغيرا ----------
reset role;

select results_eq(
  $$ select status from public.orders
      where id in ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
      order by id $$,
  $$ values ('accepted'::text), ('pending') $$,
  'المحاولات المرفوضة لم تغيّر الطلب المقبول ولا طلب العميل الآخر');

select * from finish();
rollback;
