// supabase/functions/register-premium/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function — التحقق من صلاحية الكوبون فقط (بدون استهلاك)
// لا تغير أي بيانات — validation only
//
// بعد إنشاء الحساب بنجاح، Register.tsx تستدعي activate-coupon
// لاستهلاك الكوبون atomically عبر redeem_coupon_atomic()
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { code } = await req.json()
    if (!code || typeof code !== 'string') return json({ error: 'كود الكوبون مطلوب' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // validate_coupon_only() — قراءة فقط، لا تغيير في DB
    const { data: result, error: rpcErr } = await admin.rpc(
      'validate_coupon_only',
      { p_coupon_code: code.trim() }
    )

    if (rpcErr) throw rpcErr
    if (!result?.valid) return json({ error: result?.error ?? 'كوبون غير صالح' }, 400)

    return json({
      valid:         true,
      coupon_id:     result.coupon_id,
      duration_days: result.duration_days,
      expires_at:    result.expires_at,
    })
  } catch (err: any) {
    console.error('[register-premium]', err)
    return json({ error: err.message ?? 'حدث خطأ' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
