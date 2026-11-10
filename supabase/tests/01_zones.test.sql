-- اختبارات المناطق ورسوم التوصيل.
-- كل الملف داخل معاملة (begin ... rollback): أي بيانات ينشئها الاختبار تُمحى في النهاية.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

-- ---------- المناطق في seed.sql ----------

select col_type_is('public', 'zones', 'delivery_fee', 'numeric(10,2)',
  'رسوم التوصيل من نوع numeric(10,2)');

select results_eq(
  $$ select name_ar, delivery_fee, sort_order, is_active from public.zones order by sort_order $$,
  $$ values
    ('عين زارة'::text,  10.00::numeric(10,2), 1, true),
    ('طريق المشتل',     10.00, 2, true),
    ('الفرناج',         10.00, 3, true),
    ('خلة الفرجان',     10.00, 4, true),
    ('صلاح الدين',      20.00, 5, true),
    ('طريق الشوك',      20.00, 6, true),
    ('الهضبة',          20.00, 7, true),
    ('سوق الجمعة',      20.00, 8, true),
    ('وادي الربيع',     20.00, 9, true) $$,
  'المناطق هي التسع المتفق عليها فقط، برسومها وترتيبها');

-- ---------- طلب من متجر في عين زارة إلى عميل في الحلقة ب ----------

-- عميل تجريبي وعنوانه في صلاح الدين (الحلقة ب)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '218910000001@phone.tawsil.app',
   '{"full_name": "عميل الاختبار", "phone": "+218910000001"}');

insert into public.addresses (id, user_id, label, zone_id, description) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'البيت',
   (select id from public.zones where name_ar = 'صلاح الدين'), 'قرب الجامع');

select isnt(
  (select s.id from public.stores s join public.zones z on z.id = s.zone_id
    where z.name_ar = 'عين زارة' limit 1),
  null,
  'يوجد متجر تجريبي في عين زارة');

select is(
  (select z.delivery_fee from public.addresses a join public.zones z on z.id = a.zone_id
    where a.id = '00000000-0000-0000-0000-0000000000a1'),
  20.00::numeric,
  'الرسوم تتبع منطقة العميل: عنوان في صلاح الدين رسومه 20.00 والمتجر في عين زارة');

-- نحفظ الطلب كما ستحفظه الدالة create_order في المرحلة 3:
-- مجموع المنتجات 35.00 + رسوم منطقة العميل
insert into public.orders
  (id, customer_id, store_id, subtotal, delivery_fee, total,
   customer_name, customer_phone, zone_name, address_description)
  select '00000000-0000-0000-0000-0000000000b1', a.user_id,
       (select s.id from public.stores s join public.zones sz on sz.id = s.zone_id
         where sz.name_ar = 'عين زارة' limit 1),
       35.00, z.delivery_fee, 35.00 + z.delivery_fee,
       'عميل الاختبار', '+218910000001', z.name_ar, a.description
  from public.addresses a join public.zones z on z.id = a.zone_id
 where a.id = '00000000-0000-0000-0000-0000000000a1';

select is(
  (select delivery_fee from public.orders where id = '00000000-0000-0000-0000-0000000000b1'),
  20.00::numeric,
  'طلب من عين زارة إلى الحلقة ب: رسوم التوصيل المحفوظة 20.00');

select is(
  (select total from public.orders where id = '00000000-0000-0000-0000-0000000000b1'),
  55.00::numeric,
  'إجمالي الطلب = 35.00 منتجات + 20.00 توصيل = 55.00');

select throws_ok(
  $$ update public.orders set total = 45.00 where id = '00000000-0000-0000-0000-0000000000b1' $$,
  '23514', null,
  'قاعدة البيانات ترفض إجماليًا لا يساوي المنتجات + الرسوم');

select * from finish();
rollback;
