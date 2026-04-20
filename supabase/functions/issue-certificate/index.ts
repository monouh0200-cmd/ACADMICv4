// supabase/functions/issue-certificate/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function — إصدار شهادة بعد التحقق server-side من إتمام الدورة
//
// يمنع: مستخدم يبعت INSERT مباشر على جدول certificates
// التحقق يشمل:
//   1. المستخدم مسجّل في الكورس
//   2. أكمل جميع الدروس (user_progress)
//   3. لم يحصل على شهادة مسبقاً (أو يُعيدها)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── 1. التحقق من المستخدم ────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'غير مصرح — يجب تسجيل الدخول' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'انتهت الجلسة — سجّل الدخول مجدداً' }, 401)

    // ── 2. استخراج course_id ──────────────────────────────────────────────────
    const { course_id } = await req.json()
    if (!course_id || typeof course_id !== 'string') {
      return json({ error: 'معرّف الكورس مطلوب' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 3. تحقق: هل المستخدم مسجّل في الكورس؟ ───────────────────────────────
    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle()

    if (!enrollment) {
      return json({ error: 'أنت غير مسجّل في هذه الدورة' }, 403)
    }

    // ── 4. تحقق: عدد الدروس الكلي للكورس ────────────────────────────────────
    const { count: totalLessons } = await admin
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course_id)

    if (!totalLessons || totalLessons === 0) {
      return json({ error: 'لا توجد دروس في هذه الدورة' }, 400)
    }

    // ── 5. تحقق: عدد الدروس المكتملة ─────────────────────────────────────────
    const { count: completedLessons } = await admin
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .eq('is_completed', true)

    if (!completedLessons || completedLessons < totalLessons) {
      return json({
        error: `لم تُكمل الدورة بعد — أكملت ${completedLessons ?? 0} من ${totalLessons} درساً`,
        progress: { completed: completedLessons ?? 0, total: totalLessons },
      }, 403)
    }

    // ── 6. هل شهادة موجودة مسبقاً؟ ───────────────────────────────────────────
    const { data: existing } = await admin
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle()

    if (existing) {
      return json({ success: true, certificate: existing, already_issued: true })
    }

    // ── 7. إصدار الشهادة ──────────────────────────────────────────────────────
    const { data: cert, error: insertErr } = await admin
      .from('certificates')
      .insert({
        user_id:   user.id,
        course_id: course_id,
        issued_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertErr) {
      // unique constraint race — جلب الموجود
      if (insertErr.code === '23505') {
        const { data: dup } = await admin
          .from('certificates')
          .select('*').eq('user_id', user.id).eq('course_id', course_id).maybeSingle()
        return json({ success: true, certificate: dup, already_issued: true })
      }
      throw insertErr
    }

    // ── 8. إشعار للطالب ───────────────────────────────────────────────────────
    const { data: course } = await admin
      .from('courses').select('title').eq('id', course_id).maybeSingle()

    await admin.from('notifications').insert({
      user_id: user.id,
      type:    'certificate_issued',
      title:   '🏆 تهانينا! حصلت على شهادتك',
      body:    `أتممت دورة "${course?.title ?? ''}" بنجاح وحصلت على شهادة إتمام.`,
      link:    `/student/certificate/${course_id}`,
    })

    return json({ success: true, certificate: cert })

  } catch (err: any) {
    console.error('[issue-certificate]', err)
    return json({ error: err.message ?? 'حدث خطأ أثناء إصدار الشهادة' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
