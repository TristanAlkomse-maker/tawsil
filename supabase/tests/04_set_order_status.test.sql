-- اختبارات الدالة set_order_status: كل انتقال مسموح ينجح، الممنوع يُرفض،
-- غير المدير يُرفض، وكل تغيير يُسجَّل في order_status_history.
-- كل الملف داخل معاملة (begin ... rollback): لا شيء مما ينشئه الاختبار يبقى في القاعدة.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- ---------- التجهيز (بصلاحيات المالك postgres) ----------

-- (أ) عميل، و (ج) مدير
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '218910000001@phone.tawsil.app',
   '{"full_name": "العميل أ", "phone": "+218910000001"}'),
  ('00000000-0000-0000-0000-00000000000c', '218910000003@phone.tawsil.app',
   '{"full_name": "المدير ج", "phone": "+218910000003"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000c';

-- ستة طلبات للعميل أ، كل واحد يبدأ من حالة مختلفة حسب ما نريد اختباره
insert into public.orders
  (id, status, customer_id, store_id, subtotal, delivery_fee, total,
   customer_name, customer_phone, zone_name, address_description)
  select o.id, o.status, '00000000-0000-0000-0000-00000000000a',
         (select id from public.stores limit 1), 30.00, 20.00, 50.00,
         'العميل أ', '+218910000001', 'الهضبة', 'وصف'
  from (values
    ('00000000-0000-0000-0000-000000000001'::uuid, 'pending'),     -- يمر بالمسار الكامل حتى التسليم
    ('00000000-0000-0000-0000-000000000002',       'pending'),     -- يُرفض
    ('00000000-0000-0000-0000-000000000003',       'accepted'),    -- يُلغى بعد القبول
    ('00000000-0000-0000-0000-000000000004',       'preparing'),   -- يُلغى أثناء التحضير
    ('00000000-0000-0000-0000-000000000005',       'on_the_way'),  -- يُلغى في الطريق
    ('00000000-0000-0000-0000-000000000006',       'pending')      -- للمحاولات الممنوعة
  ) as o (id, status);

-- ---------- الزائر ----------
set local role anon;

select throws_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000006', 'accepted') $$,
  '42501', null,
  'الزائر غير المسجّل لا يستدعي set_order_status');

-- ---------- العميل أ (ليس مديرًا) ----------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select throws_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000006', 'accepted') $$,
  'P0001', 'not_admin',
  'العميل لا يغيّر حالة الطلب ولو كان طلبه');

-- ---------- المدير ج: الانتقالات الثمانية المسموحة ----------
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';

select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000001', 'accepted') $$,
  'pending ← accepted مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000001', 'preparing') $$,
  'accepted ← preparing مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000001', 'on_the_way') $$,
  'preparing ← on_the_way مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000001', 'delivered') $$,
  'on_the_way ← delivered مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000002', 'rejected') $$,
  'pending ← rejected مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000003', 'cancelled') $$,
  'accepted ← cancelled مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000004', 'cancelled') $$,
  'preparing ← cancelled مسموح');
select lives_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000005', 'cancelled') $$,
  'on_the_way ← cancelled مسموح');

select results_eq(
  $$ select id, status from public.orders
      where id <> '00000000-0000-0000-0000-000000000006' order by id $$,
  $$ values ('00000000-0000-0000-0000-000000000001'::uuid, 'delivered'::text),
            ('00000000-0000-0000-0000-000000000002', 'rejected'),
            ('00000000-0000-0000-0000-000000000003', 'cancelled'),
            ('00000000-0000-0000-0000-000000000004', 'cancelled'),
            ('00000000-0000-0000-0000-000000000005', 'cancelled') $$,
  'الحالة الجديدة محفوظة فعلًا في جدول orders');

-- bag_eq تقارن الصفوف دون ترتيب: داخل معاملة واحدة كل الأسطر لها نفس created_at
select bag_eq(
  $$ select status, changed_by from public.order_status_history
      where order_id = '00000000-0000-0000-0000-000000000001' $$,
  $$ values ('accepted'::text, '00000000-0000-0000-0000-00000000000c'::uuid),
            ('preparing',      '00000000-0000-0000-0000-00000000000c'),
            ('on_the_way',     '00000000-0000-0000-0000-00000000000c'),
            ('delivered',      '00000000-0000-0000-0000-00000000000c') $$,
  'كل تغيير يُسجَّل في order_status_history باسم المدير الذي نفّذه');

-- ---------- المدير ج: الانتقالات الممنوعة ----------

select throws_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000006', 'preparing') $$,
  'P0001', 'invalid_transition',
  'pending ← preparing ممنوع: لا يُتخطى القبول');

select throws_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000006', 'cancelled') $$,
  'P0001', 'invalid_transition',
  'pending ← cancelled ممنوع على المدير: إلغاء الطلب المنتظر للعميل، والمدير يرفضه');

select throws_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-000000000001', 'accepted') $$,
  'P0001', 'invalid_transition',
  'delivered حالة نهائية لا يُنتقل منها');

select throws_ok(
  $$ select public.set_order_status('00000000-0000-0000-0000-0000000000ff', 'accepted') $$,
  'P0001', 'order_not_found',
  'طلب غير موجود يُرفض');

select is(
  (select status from public.orders where id = '00000000-0000-0000-0000-000000000006')
    || ' | ' || (select count(*) from public.order_status_history
                  where order_id = '00000000-0000-0000-0000-000000000006'),
  'pending | 0',
  'المحاولات المرفوضة لا تغيّر الحالة ولا تكتب في السجل');

select * from finish();
rollback;
