// supabase/functions/redeem-coupon/index.ts
// استرداد كوبون عبر Postgres function ذرية — transaction واحدة كاملة
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'غير مصرح — يجب تسجيل الدخول أولاً' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'انتهت الجلسة' }, 401)

    const { code } = await req.json()
    if (!code || typeof code !== 'string' || code.trim().length < 3)
      return json({ error: 'كود الكوبون مطلوب' }, 400)

    // الـ Postgres function تعمل SELECT FOR UPDATE + INSERT + UPDATE في transaction واحدة
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: result, error: rpcErr } = await admin.rpc(
      'redeem_coupon_atomic',
      { p_user_id: user.id, p_coupon_code: code.trim() }
    )

    if (rpcErr) throw rpcErr
    if (result?.error) return json({ error: result.error }, 400)

    return json({ success: true, message: result?.message, expires_at: result?.expires_at })
  } catch (err: any) {
    console.error('[redeem-coupon]', err)
    return json({ error: err.message || 'حدث خطأ غير متوقع' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
