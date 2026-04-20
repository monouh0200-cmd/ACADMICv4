import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../context/ThemeContext'
import NotificationBell from './NotificationBell'
import {
  Home, BookOpen, BookMarked, Heart, ClipboardList, Award,
  Ticket, Users, BarChart3, School, LayoutGrid, Settings,
  LogOut, Search, Sun, Moon, ChevronRight, Briefcase,
  MessageCircle, GraduationCap, ShieldCheck, Trophy
} from 'lucide-react'

type NavItem = { label: string; path: string; icon: any; badge?: number; roles: string[] }

const NAV: NavItem[] = [
  // All roles
  { label: 'لوحة التحكم',    path: '/dashboard',           icon: Home,          roles: ['student','instructor','super_admin'] },
  // Student
  { label: 'مكتبة الدورات',  path: '/student/courses',     icon: BookOpen,      roles: ['student','super_admin'] },
  { label: 'دوراتي',         path: '/student/my-courses',  icon: BookMarked,    roles: ['student','super_admin'] },
  { label: 'المفضلة',        path: '/student/wishlist',    icon: Heart,         roles: ['student','super_admin'] },
  { label: 'اختباراتي',      path: '/student/results',     icon: ClipboardList, roles: ['student','super_admin'] },
  { label: 'شهاداتي',        path: '/student/my-certs',    icon: Award,         roles: ['student','super_admin'] },
  { label: 'لوحة الشرف',     path: '/student/leaderboard', icon: Trophy,        roles: ['student','super_admin'] },
  { label: 'ترقية الحساب',   path: '/student/redeem',      icon: Ticket,        roles: ['student'] },
  // Instructor
  { label: 'دوراتي',         path: '/instructor/courses',  icon: BookOpen,      roles: ['instructor'] },
  { label: 'التعليقات',      path: '/instructor/comments', icon: MessageCircle, roles: ['instructor'] },
  { label: 'نتائج الطلاب',   path: '/instructor/results',  icon: BarChart3,     roles: ['instructor'] },
  { label: 'ملفي الشخصي',    path: '/instructor/profile',  icon: Briefcase,     roles: ['instructor'] },
  // Admin
  { label: 'المستخدمون',     path: '/admin/users',         icon: Users,         roles: ['super_admin'] },
  { label: 'إدارة المحتوى',  path: '/admin/content',       icon: LayoutGrid,    roles: ['super_admin'] },
  { label: 'الكوبونات',      path: '/admin/premium',       icon: Ticket,        roles: ['super_admin'] },
  { label: 'الفصول',         path: '/admin/classrooms',    icon: School,        roles: ['super_admin'] },
  { label: 'التحليلات',      path: '/admin/analytics',     icon: BarChart3,     roles: ['super_admin'] },
  // All
  { label: 'الإعدادات',      path: '/student/settings',    icon: Settings,      roles: ['student','instructor','super_admin'] },
]

const ROLE_INFO: Record<string, { label: string; color: string; icon: any }> = {
  student:     { label: 'طالب',       color: 'bg-blue-100 text-blue-700',   icon: GraduationCap },
  instructor:  { label: 'مدرس',       color: 'bg-indigo-100 text-indigo-700', icon: Briefcase },
  super_admin: { label: 'مدير النظام', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
}

export default function AppSidebar() {
  const { profile, logout } = useAuthStore()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  if (!profile) return null

  const role = profile.role as string
  const ri = ROLE_INFO[role] || ROLE_INFO.student
  const RoleIcon = ri.icon

  const visible = NAV.filter(n => n.roles.includes(role))
  const filtered = search
    ? visible.filter(n => n.label.includes(search))
    : visible

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <aside
      className="fixed inset-y-0 right-0 w-60 flex flex-col z-50 border-l transition-colors duration-200"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>الأكاديمية</span>
        <div className="flex items-center gap-1 mr-auto">
          <NotificationBell />
          <button onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
            style={{ color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث سريع..."
            className="w-full pr-8 pl-3 py-2 rounded-lg text-xs font-bold outline-none transition-colors"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          const Icon = item.icon
          return (
            <button key={item.path} onClick={() => { navigate(item.path); setSearch('') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-right transition-all font-bold text-sm"
              style={{
                background: active ? 'var(--emerald-l)' : 'transparent',
                color: active ? 'var(--emerald)' : 'var(--text-secondary)',
              }}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{item.badge}</span>
              ) : active ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'var(--bg-input)' }}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {(profile.full_name || profile.username || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>
              {profile.full_name || profile.username}
            </div>
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 ${ri.color}`}>
              <RoleIcon className="w-2.5 h-2.5" /> {ri.label}
            </div>
          </div>
          <button onClick={handleLogout} title="خروج"
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
            style={{ color: 'var(--text-muted)' }}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// Wrapper layout that includes sidebar + content
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <AppSidebar />
      <div className="mr-60 min-h-screen">
        {children}
      </div>
    </div>
  )
}
