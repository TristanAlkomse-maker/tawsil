// يحوّل ملف اختبار pgTAP إلى استعلام واحد يصلح للّصق في SQL Editor بلوحة Supabase.
// السبب: الأمر `npx supabase test db` يحتاج Docker، والمحرر يعرض نتيجة آخر استعلام فقط.
// الحل: نجمع سطر نتيجة كل اختبار في جدول مؤقت ونعرضه كله قبل rollback.
// الاستخدام: node supabase/tap-for-sql-editor.mjs supabase/tests/01_zones.test.sql
import { readFileSync } from 'node:fs';

const sql = readFileSync(process.argv[2], 'utf8')
  .replace(
    /^begin;$/m,
    [
      'begin;',
      'create temp table _tap (n int generated always as identity, line text) on commit drop;',
      // نفعّل RLS هنا بقاعدة تسمح للجميع، وإلا يعرض المحرر نافذة "Potential issue detected"
      // وزرّها "Run and enable RLS" يضيف أمرًا بعد rollback فيفشل الاستعلام.
      'alter table _tap enable row level security;',
      'create policy _tap_all on _tap for all to public using (true) with check (true);',
      'grant all on _tap to public;',
    ].join('\n'),
  )
  // كل سطر يبدأ بـ select هو اختبار: نحفظ نتيجته بدل عرضها
  .replace(/^select /gm, 'insert into _tap (line) select ')
  .replace(/^rollback;$/m, 'reset role;\nselect line from _tap order by n;\nrollback;');

process.stdout.write(sql);
