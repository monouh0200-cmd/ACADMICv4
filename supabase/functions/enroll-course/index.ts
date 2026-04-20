// supabase/functions/enroll-course/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function — تسجيل طالب في كورس مع التحقق من premium server-side
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'غير مصرح' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return json({ error: 'انتهت الجلسة — سجّل الدخول مجدداً' }, 401)

    const { course_id } = await req.json()
    if (!course_id) return json({ error: 'معرّف الكورس مطلوب' }, 400)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── التحقق من وجود الكورس وهل هو premium ─────────────────────────────────
    const { data: course, error: courseErr } = await adminClient
      .from('courses')
      .select('id, is_premium, title')
      .eq('id', course_id)
      .maybeSingle()

    if (courseErr) throw courseErr
    if (!course) return json({ error: 'الكورس غير موجود' }, 404)

    // ── لو الكورس premium — تحقق من subscription المستخدم ────────────────────
    if (course.is_premium) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('subscription_type, subscription_expires_at, status')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || profile.status !== 'approved') {
        return json({ error: 'حسابك غير مفعّل' }, 403)
      }
      if (profile.subscription_type !== 'premium') {
        return json({ error: 'هذا الكورس للمشتركين البريميوم فقط — فعّل اشتراكك أولاً' }, 403)
      }
      if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()) {
        return json({ error: 'انتهت صلاحية اشتراكك البريميوم' }, 403)
      }
    }

    // ── التحقق من التسجيل المسبق ─────────────────────────────────────────────
    const { data: existing } = await adminClient
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle()

    if (existing) return json({ success: true, message: 'أنت مسجّل بالفعل في هذا الكورس', already_enrolled: true })

    // ── تسجيل الطالب ─────────────────────────────────────────────────────────
    const { error: enrollErr } = await adminClient
      .from('enrollments')
      .insert({ user_id: user.id, course_id })

    if (enrollErr) throw enrollErr

    // ── إشعار للطالب ─────────────────────────────────────────────────────────
    await adminClient.from('notifications').insert({
      user_id: user.id,
      type:    'enrollment',
      title:   '🎓 تم تسجيلك بنجاح!',
      body:    `تم تسجيلك في كورس "${course.title}". بالتوفيق!`,
      link:    `/student/course/${course_id}`,
    })

    return json({ success: true, message: `✅ تم تسجيلك في "${course.title}" بنجاح` })

  } catch (err: any) {
    console.error('[enroll-course]', err)
    return json({ error: err.message || 'حدث خطأ أثناء التسجيل' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
