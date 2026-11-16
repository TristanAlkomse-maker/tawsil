-- مخزن عام لصور المتاجر في Supabase Storage.
-- "عام" يعني أن أي أحد يقرأ الصورة برابطها، وهذا مطلوب لعرضها في التطبيق.
-- لا توجد قاعدة تسمح بالرفع: الرفع يتم من لوحة Supabase فقط.
insert into storage.buckets (id, name, public)
values ('stores', 'stores', true)
on conflict (id) do nothing;
