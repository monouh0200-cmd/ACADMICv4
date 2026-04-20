import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Loader2, ShieldOff, ArrowRight } from 'lucide-react'

const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/admin/users':               ['super_admin'],
  '/admin/premium':             ['super_admin'],
  '/admin/content':             ['super_admin'],
  '/admin/classrooms':          ['super_admin'],
  '/admin/analytics':           ['super_admin'],
  '/instructor/profile':        ['instructor','super_admin'],
  '/instructor/courses':        ['instructor','super_admin'],
  '/instructor/course':         ['instructor','super_admin'],
  '/instructor/comments':       ['instructor','super_admin'],
  '/instructor/results':        ['instructor','super_admin'],
  '/student/courses':           ['student','super_admin'],
  '/student/course-details':    ['student','super_admin'],
  '/student/my-courses':        ['student','super_admin'],
  '/student/course':            ['student','super_admin'],
  '/student/quizzes':           ['student','super_admin'],
  '/student/quiz':              ['student','super_admin'],
  '/student/results':           ['student','super_admin'],
  '/student/redeem':            ['student','super_admin'],
  '/student/certificate':       ['student','super_admin'],
  '/student/my-certs':          ['student','super_admin'],
  '/student/wishlist':          ['student','super_admin'],
  '/student/settings':          ['student','instructor','super_admin'],
  '/student/leaderboard':       ['student','instructor','super_admin'],
  '/student/instructor':        ['student','super_admin'],
  '/dashboard':                 ['student','instructor','super_admin'],
  '/onboarding':                ['student','instructor','super_admin'],
}

function isAllowed(pathname: string, role: string): boolean {
  // Sort by length descending → longest (most specific) prefix wins
  const key = Object.keys(ROUTE_PERMISSIONS)
    .filter(k => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  // Default DENY — any unlisted route is blocked until explicitly permitted
  if (!key) return false
  return ROUTE_PERMISSIONS[key].includes(role)
}

function AccessDenied({ role }: { role: string }) {
  const names: Record<string,string> = { student:'طالب', instructor:'مدرس', super_admin:'مدير نظام' }
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'var(--bg-app)' }} dir="rtl">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden text-center">
        <div className="bg-red-50 p-10">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">وصول مرفوض</h1>
          <p className="text-slate-500 text-sm">حسابك كـ <b className="text-red-600">{names[role] || role}</b> لا يملك صلاحية هذه الصفحة.</p>
        </div>
        <div className="p-6 space-y-2">
          <button onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold">
            <ArrowRight className="w-4 h-4" /> رجوع
          </button>
          <a href="/#/dashboard" className="block w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm">
            لوحة التحكم
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, checkSession } = useAuthStore()
  const [ready, setReady] = useState(false)
  const location = useLocation()

  useEffect(() => {
    checkSession().then(() => setReady(true))
  }, [])

  if (!ready || isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-app)' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm font-bold" style={{ color:'var(--text-secondary)' }}>جاري التحقق...</p>
      </div>
    </div>
  )

  if (!user || !profile) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAllowed(location.pathname, profile.role)) return <AccessDenied role={profile.role} />

  return <>{children}</>
}
