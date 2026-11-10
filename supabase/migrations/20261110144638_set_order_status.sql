-- الترحيل 4: الدالة set_order_status (القسم 5 من المواصفات).
-- المدير يغيّر حالة الطلب، والدالة تسمح فقط بالانتقالات المذكورة في جدول القسم 4.
create function public.set_order_status(p_order_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  -- for update = نقفل صف الطلب حتى تنتهي الدالة،
  -- فلا يغيّر مديران (أو مدير وعميل يلغي) الحالة نفسها في اللحظة نفسها.
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  -- الانتقالات المسموحة للمدير: (الحالة الحالية، الحالة الجديدة).
  -- pending ← cancelled ليست هنا: إلغاء الطلب المنتظر للعميل عبر cancel_order.
  if (v_status, p_new_status) not in (
    ('pending',    'accepted'),
    ('pending',    'rejected'),
    ('accepted',   'preparing'),
    ('accepted',   'cancelled'),
    ('preparing',  'on_the_way'),
    ('preparing',  'cancelled'),
    ('on_the_way', 'delivered'),
    ('on_the_way', 'cancelled')
  ) then
    raise exception 'invalid_transition';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (p_order_id, p_new_status, auth.uid());
end;
$$;

revoke execute on function public.set_order_status(uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, text) to authenticated;
