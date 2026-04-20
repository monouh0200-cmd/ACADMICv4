# Academy v6 — Security & Deployment Notes

## ⚠️ قبل النشر — خطوات إلزامية

### 1. إعداد ملف `.env`
```bash
cp .env.example .env
# افتح .env واملأ القيم الحقيقية من لوحة Supabase
```
ملف `.env` مستبعد من git (مُدرج في `.gitignore`).  
**لا ترفع `.env` أبداً على GitHub أو أي مكان عام.**

---

### 2. تشغيل Migration في Supabase
افتح **Supabase → SQL Editor** وشغّل:
```
supabase_migrations.sql
```
يحتوي الملف على:
- إنشاء الجداول الجديدة
- RLS Policies على **جميع** الجداول (قديمة وجديدة)
- Indexes + Triggers

---

### 3. التحقق من RLS في Supabase Dashboard
بعد تشغيل الـ migration، تأكد في **Supabase → Table Editor → كل جدول**:
- ✅ RLS: **Enabled**
- ✅ Policies موجودة

جداول تحتاج تأكيد خاص:
- `profiles`
- `courses`
- `lessons`
- `classrooms`
- `enrollments`
- `coupons`
- `certificates`
- `notifications`

---

## 🔒 ما تم إصلاحه في هذا الإصدار (v6-secure)

| # | المشكلة | الحل |
|---|---------|------|
| 1 | `.env` مرفوع في الريبو | حُذف `.env` + أُضيف `.gitignore` + `.env.example` |
| 2 | `default allow` في `ProtectedRoute` | تغيير `if (!key) return true` → `return false` |
| 3 | Route matching بـ `startsWith` بدون حدود | استخدام `pathname === k \|\| pathname.startsWith(k + '/')` |
| 4 | مفيش `ErrorBoundary` | `ErrorBoundary` component جديد يلف التطبيق كله |
| 5 | Validation ضعيفة في Register | تحقق من email, password (8 chars + letters+numbers), whatsapp |
| 6 | Validation ضعيفة في Login | تحقق من email format + password length |
| 7 | RLS ناقص على الجداول الأصلية | policies كاملة على profiles/courses/lessons/classrooms |

---

## 📋 خطوات النشر (Vercel / Netlify)

```bash
# 1. Build
npm install
npm run build

# 2. اضبط Environment Variables في لوحة الـ hosting:
#    VITE_SUPABASE_URL      = قيمتك الحقيقية
#    VITE_SUPABASE_ANON_KEY = قيمتك الحقيقية

# 3. Deploy مجلد: dist/
```

---

## 📌 ما يُنصح به مستقبلاً (ليس إلزامياً الآن)

- **Sentry** — استبدل `console.error` في `ErrorBoundary` بـ `Sentry.captureException`
- **Input sanitization** — أضف `DOMPurify` إذا قررت دعم HTML في التعليقات
- **Tests** — ابدأ بـ Vitest على authStore و isAllowed
- **Rate limiting custom** — إذا احتجت أكثر من حماية Supabase الافتراضية، استخدم Cloudflare WAF

---

## 🔑 تفعيل JWT Role Claims (اختياري لكن مُوصى به)

بدون هذه الخطوة، `is_admin()` تعمل DB lookup في كل policy evaluation.
مع JWT claims، الـ role موجود في الـ token نفسه — أسرع وأكثر أماناً.

### الخطوات:
1. افتح **Supabase → Authentication → Hooks**
2. أضف **Custom Access Token Hook** وشغّل هذه الـ Function:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = (event->>'user_id')::uuid;

  RETURN jsonb_set(event, '{claims,user_role}', to_jsonb(COALESCE(user_role, 'student')));
END;
$$;

-- امنح الصلاحية للـ hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

3. بعد التفعيل، `is_admin()` ستستخدم الـ JWT claim تلقائياً بدون DB lookup.

