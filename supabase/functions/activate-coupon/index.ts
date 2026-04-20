// supabase/functions/activate-coupon/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function — استهلاك الكوبون بعد إنشاء الحساب بنجاح
// يُستدعى من Register.tsx مباشرة بعد supabase.auth.signUp + profiles.insert
// يستخدم redeem_coupon_atomic() لضمان الذرية الكاملة
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    // هذه الـ function تقبل service-level call من الفرونت مباشرة بعد التسجيل
    // المستخدم الجديد لا يملك session بعد (email confirmation قد يكون مطلوباً)
    // لذلك نُمرر user_id صراحةً ونتحقق من وجود profile

    const { user_id, coupon_code } = await req.json()
    if (!user_id || !coupon_code) return json({ error: 'user_id و coupon_code مطلوبان' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // تأكد من وجود الـ profile (أُنشئ في نفس الطلب)
    const { data: profile } = await admin
      .from('profiles').select('id, status').eq('id', user_id).maybeSingle()

    if (!profile) return json({ error: 'المستخدم غير موجود' }, 404)

    // استدعاء الـ Postgres function الذرية
    const { data: result, error: rpcErr } = await admin.rpc(
      'redeem_coupon_atomic',
      { p_user_id: user_id, p_coupon_code: coupon_code }
    )

    if (rpcErr) throw rpcErr
    if (result?.error) return json({ error: result.error }, 400)

    return json({ success: true, expires_at: result?.expires_at })
  } catch (err: any) {
    console.error('[activate-coupon]', err)
    return json({ error: err.message ?? 'حدث خطأ' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
