import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Bell, X, CheckCheck, BookOpen, Award, Users, Info } from 'lucide-react'

type Notification = {
  id: string
  type: 'course_approved' | 'certificate_issued' | 'account_approved' | 'new_lesson' | 'general'
  title: string
  body: string
  is_read: boolean
  created_at: string
  link?: string
}

const TYPE_ICON: Record<string, any> = {
  course_approved: BookOpen,
  certificate_issued: Award,
  account_approved: Users,
  new_lesson: BookOpen,
  general: Info,
}

const TYPE_COLOR: Record<string, string> = {
  course_approved: 'bg-blue-50 text-blue-600',
  certificate_issued: 'bg-amber-50 text-amber-600',
  account_approved: 'bg-green-50 text-green-600',
  new_lesson: 'bg-indigo-50 text-indigo-600',
  general: 'bg-slate-50 text-slate-600',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return `منذ ${m} دقيقة`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }

  useEffect(() => {
    load()
    // Realtime subscription للإشعارات الجديدة
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // إغلاق عند الضغط خارج
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markOne = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
        <Bell className="w-5 h-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-14 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[999] overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  <CheckCheck className="w-4 h-4" /> تحديد الكل كمقروء
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">لا توجد إشعارات بعد</p>
              </div>
            ) : notifications.map(n => {
              const Icon = TYPE_ICON[n.type] || Info
              const colorClass = TYPE_COLOR[n.type] || TYPE_COLOR.general
              return (
                <button key={n.id}
                  onClick={() => { markOne(n.id); if (n.link) window.location.href = n.link }}
                  className={`w-full flex items-start gap-3 px-5 py-4 text-right hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black text-slate-800 ${!n.is_read ? '' : 'font-bold'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
