import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  Users, BookOpen, Award, TrendingUp, ArrowRight,
  Loader2, GraduationCap, Crown, Clock, BarChart3,
  CheckCircle2, Activity
} from 'lucide-react'

type StatCard = { label: string; value: string | number; sub?: string; icon: any; color: string }

export default function Analytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0, pendingUsers: 0, premiumUsers: 0,
    totalCourses: 0, totalLessons: 0, totalCertificates: 0,
    completedProgress: 0, thisWeekUsers: 0 })
  const [topCourses, setTopCourses] = useState<any[]>([])
  const [recentCerts, setRecentCerts] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

        const [
          { count: totalUsers },
          { count: pendingUsers },
          { count: premiumUsers },
          { count: totalCourses },
          { count: totalLessons },
          { count: totalCertificates },
          { count: completedProgress },
          { count: thisWeekUsers },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_type', 'premium'),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('certificates').select('*', { count: 'exact', head: true }),
          supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('is_completed', true),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        ])

        setStats({
          totalUsers: totalUsers || 0,
          pendingUsers: pendingUsers || 0,
          premiumUsers: premiumUsers || 0,
          totalCourses: totalCourses || 0,
          totalLessons: totalLessons || 0,
          totalCertificates: totalCertificates || 0,
          completedProgress: completedProgress || 0,
          thisWeekUsers: thisWeekUsers || 0 })

        // أكثر الدورات نشاطاً
        const { data: courses } = await supabase.from('courses').select('id,title')
        if (courses) {
          const enriched = await Promise.all(courses.map(async (c) => {
            const { data: up } = await supabase.from('user_progress').select('user_id').eq('course_id', c.id)
            const unique = up ? new Set(up.map((u: any) => u.user_id)).size : 0
            const { count: lessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', c.id)
            return { ...c, students: unique, lessons: lessons || 0 }
          }))
          setTopCourses(enriched.sort((a, b) => b.students - a.students).slice(0, 5))
        }

        // آخر الشهادات
        const { data: certs } = await supabase.from('certificates')
          .select('*, profiles(username,full_name), courses(title)')
          .order('issued_at', { ascending: false }).limit(5)
        if (certs) setRecentCerts(certs)

      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const STAT_CARDS: StatCard[] = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, sub: `${stats.thisWeekUsers} جديد هذا الأسبوع`, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'حسابات معلقة', value: stats.pendingUsers, sub: 'بانتظار الموافقة', icon: Clock, color: 'bg-orange-50 text-orange-600' },
    { label: 'مشتركون Premium', value: stats.premiumUsers, sub: `${stats.totalUsers ? Math.round(stats.premiumUsers / stats.totalUsers * 100) : 0}% من الكل`, icon: Crown, color: 'bg-amber-50 text-amber-600' },
    { label: 'الدورات المتاحة', value: stats.totalCourses, sub: `${stats.totalLessons} درس إجمالاً`, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'دروس مكتملة', value: stats.completedProgress, sub: 'إجمالي عمليات الإتمام', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'شهادات صادرة', value: stats.totalCertificates, sub: 'شهادات موثقة', icon: Award, color: 'bg-purple-50 text-purple-600' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white rounded-xl text-slate-500 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">لوحة التحليلات</h1>
            <p className="text-slate-500 font-medium">نظرة شاملة على أداء المنصة</p>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-800 mb-1">{s.value.toLocaleString()}</div>
              <div className="font-bold text-slate-600 text-sm">{s.label}</div>
              {s.sub && <div className="text-xs text-slate-400 font-medium mt-1">{s.sub}</div>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Courses */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-black text-slate-800 text-lg mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> أكثر الدورات نشاطاً
            </h2>
            {topCourses.length === 0 ? (
              <p className="text-slate-400 text-center py-6 font-bold text-sm">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-3">
                {topCourses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-500">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">{c.title}</div>
                      <div className="text-xs text-slate-400">{c.lessons} درس</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-blue-600">
                      <GraduationCap className="w-4 h-4" /> {c.students}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Certificates */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-black text-slate-800 text-lg mb-5 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> آخر الشهادات الصادرة
            </h2>
            {recentCerts.length === 0 ? (
              <p className="text-slate-400 text-center py-6 font-bold text-sm">لا توجد شهادات بعد</p>
            ) : (
              <div className="space-y-3">
                {recentCerts.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">
                        {cert.profiles?.full_name || cert.profiles?.username}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{cert.courses?.title}</div>
                    </div>
                    <div className="text-xs text-slate-400 font-bold shrink-0">
                      {new Date(cert.issued_at).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-black text-slate-800 text-lg mb-5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" /> إجراءات سريعة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'الحسابات المعلقة', badge: stats.pendingUsers, path: '/admin/users', color: 'bg-orange-50 text-orange-600 border-orange-100' },
              { label: 'إدارة الكوبونات', badge: null, path: '/admin/premium', color: 'bg-amber-50 text-amber-600 border-amber-100' },
              { label: 'إدارة المحتوى', badge: stats.totalCourses, path: '/admin/content', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'الفصول الدراسية', badge: null, path: '/admin/classrooms', color: 'bg-green-50 text-green-600 border-green-100' },
            ].map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)}
                className={`relative p-4 rounded-2xl border ${a.color} font-bold text-sm text-right hover:shadow-md transition-all`}>
                {a.label}
                {a.badge !== null && a.badge! > 0 && (
                  <span className="absolute top-2 left-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {a.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
