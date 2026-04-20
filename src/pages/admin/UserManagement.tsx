import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, ShieldX, Loader2, Search, Clock, CheckCircle2, XCircle,
  MessageSquare, Trash2, ArrowRight, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'

type TabType = 'pending' | 'all' | 'comments'

export default function UserManagement() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('pending')

  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [loadingPending, setLoadingPending] = useState(true)

  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterSub, setFilterSub] = useState('all')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentSearch, setCommentSearch] = useState('')

  const [msg, setMsg] = useState({ text: '', type: '' })

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const loadPending = async () => {
    setLoadingPending(true)
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPendingUsers(data)
    setLoadingPending(false)
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    const { data } = await supabase.from('profiles').select('*').neq('status', 'pending').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoadingUsers(false)
  }

  const loadComments = async () => {
    setLoadingComments(true)
    const { data } = await supabase.from('comments').select('*, profiles(username, email, role), lessons(title)').order('created_at', { ascending: false })
    if (data) setComments(data)
    setLoadingComments(false)
  }

  useEffect(() => { loadPending(); loadUsers(); loadComments() }, [])

  const handleAction = async (userId: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase.from('profiles').update({ status: action }).eq('id', userId)
    if (error) { showMsg('فشل تحديث الحساب', 'error'); return }
    showMsg(action === 'approved' ? '✅ تم قبول الحساب' : '✅ تم رفض الحساب', 'success')
    loadPending(); loadUsers()
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('هل تريد حذف هذا التعليق؟')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) { showMsg('فشل حذف التعليق', 'error'); return }
    showMsg('✅ تم حذف التعليق', 'success')
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const filteredUsers = users.filter(u => {
    const s = u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const r = filterRole === 'all' || u.role === filterRole
    const sub = filterSub === 'all' || u.subscription_type === filterSub
    return s && r && sub
  })

  const filteredComments = comments.filter(c =>
    c.content?.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.profiles?.username?.toLowerCase().includes(commentSearch.toLowerCase())
  )

  const tabs = [
    { key: 'pending' as TabType, label: 'طلبات التسجيل', icon: Clock, count: pendingUsers.length },
    { key: 'all' as TabType, label: 'جميع المستخدمين', icon: Users, count: users.length },
    { key: 'comments' as TabType, label: 'إدارة التعليقات', icon: MessageSquare, count: comments.length },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800">لوحة إدارة المستخدمين</h1>
            <p className="text-slate-500 font-medium">الموافقة على الحسابات، متابعة المستخدمين، وإدارة التعليقات</p>
          </div>
        </div>

        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl font-bold flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />} {msg.text}
          </div>
        )}

        <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all flex-1 justify-center ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${isActive ? 'bg-white/20' : tab.key === 'pending' && tab.count > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
              </button>
            )
          })}
        </div>

        {/* ─── PENDING TAB ─── */}
        {activeTab === 'pending' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-700">طلبات التسجيل المعلقة</h2>
              <button onClick={loadPending} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-slate-500 border border-slate-200 hover:border-indigo-300 font-bold text-sm">
                <RefreshCw className="w-4 h-4" /> تحديث
              </button>
            </div>
            {loadingPending ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
              : pendingUsers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <p className="font-bold text-slate-500 text-xl">لا توجد طلبات معلقة حالياً ✨</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="bg-white rounded-[2rem] border border-amber-100 shadow-sm p-6 flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 font-black text-2xl shrink-0">
                          {u.username?.charAt(0)?.toUpperCase() || '؟'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-slate-800 text-lg">{u.username}</h3>
                          <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${u.role === 'instructor' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                              {u.role === 'instructor' ? '👨‍🏫 مدرس' : '🎓 طالب'}
                            </span>
                            {u.subscription_type && <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-slate-50 border-slate-100 text-slate-600">{u.subscription_type === 'premium' ? '⭐ بريميوم' : '🆓 مجاني'}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5">
                        {u.specialization && <div className="flex gap-2"><span className="text-slate-400 font-bold">التخصص:</span><span className="font-black text-slate-700">{u.specialization}</span></div>}
                        {u.study_year && <div className="flex gap-2"><span className="text-slate-400 font-bold">السنة الدراسية:</span><span className="font-black text-slate-700">{u.study_year}</span></div>}
                        {u.whatsapp && <div className="flex gap-2"><span className="text-slate-400 font-bold">واتساب:</span><span className="font-black text-slate-700" dir="ltr">{u.whatsapp}</span></div>}
                        {u.payment_coupon && <div className="flex gap-2"><span className="text-slate-400 font-bold">قسيمة:</span><span className="font-black text-indigo-600">{u.payment_coupon}</span></div>}
                      </div>
                      <div className="flex gap-3 mt-auto">
                        <button onClick={() => handleAction(u.id, 'approved')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-md shadow-green-100 transition-colors">
                          <UserCheck className="w-4 h-4" /> قبول
                        </button>
                        <button onClick={() => handleAction(u.id, 'rejected')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-black rounded-xl border-2 border-red-100 transition-all">
                          <ShieldX className="w-4 h-4" /> رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ─── ALL USERS TAB ─── */}
        {activeTab === 'all' && (
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="ابحث بالاسم أو الإيميل..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 shadow-sm" />
              </div>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold shadow-sm">
                <option value="all">كل الأدوار</option>
                <option value="student">🎓 طلاب</option>
                <option value="instructor">👨‍🏫 مدرسون</option>
              </select>
              <select value={filterSub} onChange={e => setFilterSub(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold shadow-sm">
                <option value="all">كل الاشتراكات</option>
                <option value="premium">⭐ بريميوم</option>
                <option value="free">🆓 مجاني</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'إجمالي المستخدمين', value: users.length, color: 'text-indigo-600' },
                { label: 'الطلاب', value: users.filter(u => u.role === 'student').length, color: 'text-blue-600' },
                { label: 'مشتركو بريميوم', value: users.filter(u => u.subscription_type === 'premium').length, color: 'text-amber-600' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {loadingUsers ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
              : filteredUsers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="font-bold text-slate-500 text-xl">لا توجد نتائج</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(u => {
                    const isExp = expandedUser === u.id
                    return (
                      <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-lg shrink-0">
                            {u.username?.charAt(0)?.toUpperCase() || '؟'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-slate-800">{u.username}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${u.role === 'instructor' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                {u.role === 'instructor' ? 'مدرس' : 'طالب'}
                              </span>
                              {u.subscription_type === 'premium' && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 border border-amber-100 text-amber-600">⭐ بريميوم</span>}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${u.status === 'approved' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                {u.status === 'approved' ? 'مفعّل' : 'مرفوض'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold truncate">{u.email}</p>
                          </div>
                          <button onClick={() => setExpandedUser(isExp ? null : u.id)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-50 transition-colors">
                            {isExp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                        {isExp && (
                          <div className="border-t border-slate-50 bg-slate-50 p-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {[
                              { label: 'تاريخ التسجيل', value: new Date(u.created_at).toLocaleDateString('ar-EG') },
                              { label: 'نوع الاشتراك', value: u.subscription_type === 'premium' ? '⭐ بريميوم' : '🆓 مجاني' },
                              { label: 'الدور', value: u.role === 'instructor' ? 'مدرس' : u.role === 'student' ? 'طالب' : 'أدمن' },
                              u.specialization ? { label: 'التخصص', value: u.specialization } : null,
                              u.study_year ? { label: 'السنة الدراسية', value: u.study_year } : null,
                              u.whatsapp ? { label: 'واتساب', value: u.whatsapp } : null,
                              u.payment_coupon ? { label: 'قسيمة الدفع', value: u.payment_coupon } : null,
                              u.subscription_expires_at ? { label: 'انتهاء الاشتراك', value: new Date(u.subscription_expires_at).toLocaleDateString('ar-EG') } : null,
                            ].filter(Boolean).map((item: any, i) => (
                              <div key={i} className="bg-white rounded-xl p-3 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 mb-1">{item.label}</p>
                                <p className="font-black text-slate-700">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        )}

        {/* ─── COMMENTS TAB ─── */}
        {activeTab === 'comments' && (
          <div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-black text-slate-700">تعليقات المستخدمين ({filteredComments.length})</h2>
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="ابحث في التعليقات أو بالاسم..." value={commentSearch} onChange={e => setCommentSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 shadow-sm" />
              </div>
            </div>
            {loadingComments ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
              : filteredComments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="font-bold text-slate-500 text-xl">لا توجد تعليقات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredComments.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black shrink-0">
                        {c.profiles?.username?.charAt(0)?.toUpperCase() || '؟'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-black text-slate-800">{c.profiles?.username || 'مجهول'}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{c.profiles?.email}</span>
                          {c.lessons?.title && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">📖 {c.lessons.title}</span>}
                          <span className="text-[10px] text-slate-400 font-bold mr-auto">{new Date(c.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{c.content}</p>
                      </div>
                      <button onClick={() => handleDeleteComment(c.id)} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 self-start border border-transparent hover:border-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

      </div>
    </div>
  )
}
