-- الترحيل 3: الدالة create_order (القسم 5 من المواصفات).
-- العميل لا يكتب في جداول الطلبات مباشرة: التطبيق يرسل معرّفات المنتجات والكميات فقط،
-- والدالة تتحقق من كل شيء ثم تقرأ الأسعار والرسوم من القاعدة نفسها.
--
-- security definer = تعمل بصلاحيات المالك، لذلك تستطيع الكتابة في orders
-- مع أن العميل نفسه ممنوع من ذلك. ولهذا السبب كل شرط أمان يجب أن يكون داخلها.
--
-- عند الرفض ترمي الدالة خطأ رسالته رمز ثابت بالإنجليزية (مثل store_closed).
-- التطبيق يحوّل الرمز إلى جملة عربية من ملف ar.json في المرحلة 8.
--
-- كل الدالة تعمل في معاملة واحدة: أي خطأ يلغي كل ما حُفظ قبله.
create function public.create_order(
  p_store_id   uuid,
  p_address_id uuid,
  p_items      jsonb,              -- مثل: [{"product_id": "...", "quantity": 2}]
  p_notes      text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();   -- المستخدم الحالي، من جلسة الدخول لا من التطبيق
  v_store    public.stores;
  v_address  public.addresses;
  v_zone     public.zones;
  v_profile  public.profiles;
  v_name     text;
  v_subtotal numeric(10,2);
  v_order_id uuid;
begin
  -- الشرط 2: المتجر معتمد ومفتوح
  select * into v_store from public.stores where id = p_store_id;
  if not found or not v_store.is_active then
    raise exception 'store_unavailable';
  end if;
  if not v_store.is_open then
    raise exception 'store_closed';
  end if;

  -- الشرط 3: العنوان يخص هذا المستخدم، ومنطقته نشطة
  select * into v_address from public.addresses
   where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'address_not_found';
  end if;
  select * into v_zone from public.zones where id = v_address.zone_id;
  if not v_zone.is_active then
    raise exception 'zone_inactive';
  end if;

  -- الشرط 4: السلة غير فارغة، وكل كمية بين 1 و 99
  if p_items is null or p_items = '[]'::jsonb then
    raise exception 'empty_cart';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as i (product_id uuid, quantity int)
     where (i.quantity between 1 and 99) is not true
  ) then
    raise exception 'invalid_quantity';
  end if;

  -- الشرط 5: كل منتج يتبع هذا المتجر ومتوفر
  if exists (
    select 1 from jsonb_to_recordset(p_items) as i (product_id uuid, quantity int)
     where not exists (select 1 from public.products p
                        where p.id = i.product_id and p.store_id = p_store_id)
  ) then
    raise exception 'product_not_in_store';
  end if;

  select p.name_ar into v_name
    from jsonb_to_recordset(p_items) as i (product_id uuid, quantity int)
    join public.products p on p.id = i.product_id
   where not p.is_available
   limit 1;
  if found then
    -- اسم المنتج النافد في detail ليعرضه التطبيق للعميل
    raise exception 'product_unavailable' using detail = v_name;
  end if;

  -- الشرط 6: المجموع لا يقل عن الحد الأدنى. الأسعار من جدول products فقط.
  select sum(p.price * i.quantity) into v_subtotal
    from jsonb_to_recordset(p_items) as i (product_id uuid, quantity int)
    join public.products p on p.id = i.product_id;
  if v_subtotal < v_store.min_order then
    raise exception 'below_min_order';
  end if;

  -- الحفظ: الطلب، ثم منتجاته، ثم أول سطر في سجل الحالات
  select * into v_profile from public.profiles where id = v_uid;

  insert into public.orders
    (customer_id, store_id, subtotal, delivery_fee, total,
     customer_name, customer_phone, zone_name, address_description, lat, lng, notes)
  values
    (v_uid, p_store_id, v_subtotal, v_zone.delivery_fee, v_subtotal + v_zone.delivery_fee,
     v_profile.full_name, v_profile.phone, v_zone.name_ar, v_address.description,
     v_address.lat, v_address.lng, p_notes)
  returning id into v_order_id;

  insert into public.order_items
    (order_id, product_id, product_name, unit_price, quantity, line_total)
  select v_order_id, p.id, p.name_ar, p.price, i.quantity, p.price * i.quantity
    from jsonb_to_recordset(p_items) as i (product_id uuid, quantity int)
    join public.products p on p.id = i.product_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (v_order_id, 'pending', v_uid);

  return v_order_id;
end;
$$;

-- الشرط 1: المستخدم مسجّل الدخول. الزائر (anon) لا يملك حق استدعاء الدالة أصلًا.
revoke execute on function public.create_order(uuid, uuid, jsonb, text) from public, anon;
grant execute on function public.create_order(uuid, uuid, jsonb, text) to authenticated;
