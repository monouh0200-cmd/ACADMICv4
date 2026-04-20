// src/lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// API Layer — طبقة وسيطة بين الـ components والـ Supabase
//
// القاعدة:
//  • عمليات القراءة البسيطة → supabase.from() مباشرة (مع RLS)
//  • عمليات الكتابة الحساسة → Edge Functions (تتجاوز الـ client-side trust)
//
// الاستخدام:
//   import { api } from '@/lib/api'
//   const { data, error } = await api.courses.list()
//   const result          = await api.coupons.redeem('CODE123')
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

// ── Helper: استدعاء Edge Function ────────────────────────────────────────
async function callEdgeFunction<T = unknown>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) return { data: null, error: 'يجب تسجيل الدخول أولاً' }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey':         import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) return { data: null, error: json.error ?? 'حدث خطأ في الخادم' }
    return { data: json as T, error: null }
  } catch (err: any) {
    return { data: null, error: err.message ?? 'فشل الاتصال بالخادم' }
  }
}

// ── Courses ───────────────────────────────────────────────────────────────
const courses = {
  list: () =>
    supabase
      .from('courses')
      .select('*, profiles(username, title)')
      .order('created_at', { ascending: false }),

  get: (id: string) =>
    supabase
      .from('courses')
      .select('*, profiles(username, title)')
      .eq('id', id)
      .maybeSingle(),

  create: (payload: { title: string; description: string; is_premium: boolean }) =>
    supabase.from('courses').insert(payload).select().maybeSingle(),

  update: (id: string, payload: Partial<{ title: string; description: string; is_premium: boolean; is_published: boolean }>) =>
    supabase.from('courses').update(payload).eq('id', id),

  delete: (id: string) =>
    supabase.from('courses').delete().eq('id', id),
}

// ── Lessons ───────────────────────────────────────────────────────────────
const lessons = {
  byCourse: (courseId: string) =>
    supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),

  create: (payload: Record<string, unknown>) =>
    supabase.from('lessons').insert(payload).select().maybeSingle(),

  update: (id: string, payload: Record<string, unknown>) =>
    supabase.from('lessons').update(payload).eq('id', id),

  delete: (id: string) =>
    supabase.from('lessons').delete().eq('id', id),
}

// ── Enrollments — عبر Edge Function ─────────────────────────────────────
const enrollments = {
  enroll: (courseId: string) =>
    callEdgeFunction('enroll-course', { course_id: courseId }),

  myEnrollments: () =>
    supabase
      .from('enrollments')
      .select('*, courses(id, title, is_premium)')
      .order('enrolled_at', { ascending: false }),

  isEnrolled: async (courseId: string) => {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .maybeSingle()
    return !!data
  },
}

// ── Coupons — عبر Edge Function ───────────────────────────────────────────
const coupons = {
  redeem: (code: string) =>
    callEdgeFunction<{ success: boolean; message: string; expires_at: string }>(
      'redeem-coupon',
      { code }
    ),
}

// ── Notifications ─────────────────────────────────────────────────────────
const notifications = {
  list: () =>
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),

  markRead: (id: string) =>
    supabase.from('notifications').update({ is_read: true }).eq('id', id),

  markAllRead: (userId: string) =>
    supabase.from('notifications').update({ is_read: true }).eq('user_id', userId),
}

// ── Profiles ──────────────────────────────────────────────────────────────
const profiles = {
  // المستخدم يقرأ ملفه فقط — RLS تفرض ذلك
  get: (userId: string) =>
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),

  // فقط الأعمدة الآمنة — الـ trigger يمنع role/status/subscription
  update: (userId: string, payload: { username?: string; whatsapp?: string; onboarding_done?: boolean; onboarding_goal?: string }) =>
    supabase.from('profiles').update(payload).eq('id', userId),

  // Admin only — RLS + is_admin() تفرض ذلك
  listAll: () =>
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),

  setStatus: (userId: string, status: 'approved' | 'pending' | 'rejected') =>
    supabase.from('profiles').update({ status }).eq('id', userId),
}

// ── Certificates ─────────────────────────────────────────────────────────
const certificates = {
  mine: () =>
    supabase
      .from('certificates')
      .select('*, courses(title)')
      .order('issued_at', { ascending: false }),
}

// ── Export ────────────────────────────────────────────────────────────────
export const api = {
  courses,
  lessons,
  enrollments,
  coupons,
  notifications,
  profiles,
  certificates,
}
