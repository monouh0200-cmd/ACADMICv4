import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/AppSidebar'
import { SkeletonStats } from '../components/Skeleton'
import {
  BookOpen, Users, CreditCard, Ticket, Crown, ShieldCheck,
  UserCircle, Calendar, Sparkles, GraduationCap,
  Briefcase, Activity, Clock, Trophy, Heart,
  School, LayoutGrid, MessageCircle, BarChart3, BookMarked, Award
} from 'lucide-react'

export default function Dashboard() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ courses: 0, completedLessons: 0, points: 0, hours: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (profile?.role !== 'student' || !user) { setLoadingStats(false); return }
      try {
        const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true })
        let completedCount = 0
        try {
          const { count } = await supabase.from('user_progress').select('*', { count: 'exact', head: true })
            .eq('user_id', user.id).eq('is_completed', true)
          if (count) completedCount = count
        } catch {}
        setStats({ courses: coursesCount || 0, completedLessons: completedCount, points: completedCount * 15, hours: Number((completedCount * 0.5).toFixed(1)) })
      } catch {}
      finally { setLoadingStats(false) }
    }
    fetchStats()
  }, [user, profile])

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'super_admin': return { title: 'مدير النظام', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: ShieldCheck }
      case 'instructor':  return { title: 'مدرس',       color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: Briefcase }
      case 'student':     return { title: 'طالب',       color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: GraduationCap }
      default:            return { title: 'مستخدم',     color: 'text-gray-600 bg-gray-50 border-gray-200',       icon: UserCircle }
    }
  }

  const roleInfo = getRoleInfo(profile?.role || '')
  const RoleIcon = roleInfo.icon

  const QUICK_LINKS: { roles: string[]; path: string; icon: any; label: string; desc: string; color: string }[] = [
    { roles:['super_admin'],             path:'/admin/users',         icon:Users,       label:'إدارة المستخدمين', desc:'تفعيل الحسابات وتنظيم الصلاحيات', color:'bg-purple-50 text-purple-600' },
    { roles:['super_admin'],             path:'/admin/premium',       icon:CreditCard,  label:'كوبونات Premium',  desc:'إنشاء وإدارة كوبونات الاشتراك',   color:'bg-amber-50 text-amber-600' },
    { roles:['super_admin'],             path:'/admin/content',       icon:LayoutGrid,  label:'إدارة المحتوى',    desc:'تحديد الدروس المجانية والمدفوعة',  color:'bg-blue-50 text-blue-600' },
    { roles:['super_admin'],             path:'/admin/classrooms',    icon:School,      label:'الفصول الدراسية',  desc:'إنشاء فصول وإضافة مدرسين وطلاب',  color:'bg-green-50 text-green-600' },
    { roles:['super_admin'],             path:'/admin/analytics',     icon:BarChart3,   label:'لوحة التحليلات',   desc:'إحصائيات شاملة عن المنصة',         color:'bg-blue-50 text-blue-600' },
    { roles:['instructor'],              path:'/instructor/courses',  icon:BookOpen,    label:'دوراتي',           desc:'إنشاء الدورات ورفع الدروس',         color:'bg-indigo-50 text-indigo-600' },
    { roles:['instructor'],              path:'/instructor/comments', icon:MessageCircle,label:'التعليقات',       desc:'تابع أسئلة طلابك وردّ عليها',       color:'bg-purple-50 text-purple-600' },
    { roles:['instructor'],              path:'/instructor/results',  icon:BarChart3,   label:'نتائج الطلاب',     desc:'اعرف درجات طلابك في الاختبارات',   color:'bg-green-50 text-green-600' },
    { roles:['student','super_admin'],   path:'/student/courses',     icon:Sparkles,    label:'مكتبة الدورات',    desc:'الوصول لجميع الدورات المتاحة',      color:'bg-blue-50 text-blue-600' },
    { roles:['student','super_admin'],   path:'/student/my-courses',  icon:BookMarked,  label:'دوراتي',           desc:'الدورات التي سجلت فيها',            color:'bg-indigo-50 text-indigo-600' },
    { roles:['student','super_admin'],   path:'/student/results',     icon:BarChart3,   label:'اختباراتي',        desc:'سجل درجاتك في جميع الاختبارات',    color:'bg-amber-50 text-amber-600' },
    { roles:['student','super_admin'],   path:'/student/my-certs',    icon:Award,       label:'شهاداتي',          desc:'جميع شهاداتك الموثقة رقمياً',      color:'bg-green-50 text-green-600' },
    { roles:['student','super_admin'],   path:'/student/leaderboard', icon:Trophy,      label:'لوحة الشرف',       desc:'ترتيبك بين الطلاب والنقاط',         color:'bg-orange-50 text-orange-600' },
    { roles:['student','super_admin'],   path:'/student/wishlist',    icon:Heart,       label:'المفضلة',          desc:'الدورات التي أضفتها للمفضلة',      color:'bg-red-50 text-red-500' },
    { roles:['student'],                 path:'/student/redeem',      icon:Ticket,      label:'ترقية الحساب',     desc:'استخدم قسيمة الدفع لفتح المحتوى',  color:'bg-emerald-50 text-emerald-600' },
  ]

  const visibleLinks = QUICK_LINKS.filter(l => l.roles.includes(profile?.role || ''))
    .filter(l => !(l.path === '/student/redeem' && profile?.subscription_type === 'premium'))

  return (
    <AppLayout>
      <div className="p-6 md:p-8 page-enter" dir="rtl">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Welcome Card */}
          <div className="rounded-3xl p-6 md:p-8 border relative overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 opacity-40" style={{ background: '#dbeafe' }} />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-right w-full">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border-4 border-white shadow-xl shrink-0">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${roleInfo.color}`}>
                      <RoleIcon className="w-3.5 h-3.5" /> {roleInfo.title}
                    </span>
                    {profile?.subscription_type === 'premium' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-amber-200 bg-amber-50 text-amber-700">
                        <Crown className="w-3.5 h-3.5 text-amber-500" /> Premium
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                    مرحباً، {profile?.username || 'مستخدم'}!
                  </h1>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>سعيدون برؤيتك مرة أخرى في رحلة تعلمك.</p>
                </div>
              </div>
              {profile?.subscription_type === 'premium' && profile?.subscription_expires_at && (
                <div className="rounded-2xl p-4 flex flex-col items-center border shrink-0"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <Calendar className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>صالح حتى</span>
                  <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                    {new Date(profile.subscription_expires_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Student Stats */}
          {profile?.role === 'student' && (
            loadingStats ? <SkeletonStats /> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:'الدورات المتاحة', val:stats.courses,          icon:BookOpen,  color:'bg-blue-50 text-blue-600' },
                  { label:'دروس منتهية',     val:stats.completedLessons, icon:Activity,  color:'bg-green-50 text-green-600' },
                  { label:'نقاط التميز',     val:stats.points,           icon:Trophy,    color:'bg-amber-50 text-amber-600' },
                  { label:'ساعات تعلم',      val:stats.hours,            icon:Clock,     color:'bg-purple-50 text-purple-600' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border p-4 flex items-center gap-3"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{s.val}</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" /> روابط سريعة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleLinks.map((link, i) => (
                <button key={i} onClick={() => navigate(link.path)}
                  className="group p-5 rounded-2xl border text-right relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className={`w-11 h-11 rounded-xl ${link.color} flex items-center justify-center mb-4`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{link.label}</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{link.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
