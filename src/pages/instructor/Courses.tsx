import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, PlusCircle, Edit3, Loader2, Library, ArrowRight,
  Trash2, X, TrendingUp, GraduationCap, Save
} from 'lucide-react'

export default function Courses() {
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [courses, setCourses] = useState<any[]>([])
  const [courseStats, setCourseStats] = useState<Record<string, { students: number, lessons: number }>>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)
  // تعديل الدورة
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const navigate = useNavigate()

  const loadCourses = async () => {
    if (!user) return
    setLoadingCourses(true)
    const { data } = await supabase.from('courses').select('*').eq('instructor_id', user.id).order('created_at', { ascending: false })
    if (data) {
      setCourses(data)
      // جلب إحصائيات كل دورة
      const stats: Record<string, { students: number, lessons: number }> = {}
      let total = 0
      for (const course of data) {
        const [{ count: lessonCount }, { count: studentCount }] = await Promise.all([
          supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('user_progress').select('user_id', { count: 'exact', head: true }).eq('course_id', course.id)
        ])
        // عدد الطلاب الفريدين المشتركين في التقدم
        const { data: uniqueStudents } = await supabase
          .from('user_progress')
          .select('user_id')
          .eq('course_id', course.id)
        const unique = new Set(uniqueStudents?.map(s => s.user_id) || []).size
        stats[course.id] = { students: unique, lessons: lessonCount || 0 }
        total += unique
      }
      setCourseStats(stats)
      setTotalStudents(total)
    }
    setLoadingCourses(false)
  }

  useEffect(() => { loadCourses() }, [])

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg({ text: '', type: '' })
    try {
      const { error } = await supabase.from('courses').insert({ instructor_id: user.id, title, description })
      if (error) throw error
      setMsg({ text: '✅ تم إنشاء الدورة بنجاح!', type: 'success' })
      setTitle(''); setDescription(''); setIsFormOpen(false)
      loadCourses()
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
      setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    }
  }

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`هل تريد حذف دورة "${courseTitle}" نهائياً؟\nسيتم حذف جميع الدروس والاختبارات المرتبطة بها.`)) return
    const { data: lessons } = await supabase.from('lessons').select('id').eq('course_id', courseId)
    if (lessons?.length) {
      for (const l of lessons) {
        await supabase.from('comments').delete().eq('lesson_id', l.id)
        await supabase.from('user_progress').delete().eq('lesson_id', l.id)
      }
    }
    await supabase.from('lessons').delete().eq('course_id', courseId)
    const { data: quizzes } = await supabase.from('quizzes').select('id').eq('course_id', courseId)
    if (quizzes?.length) {
      for (const q of quizzes) await supabase.from('quiz_questions').delete().eq('quiz_id', q.id)
    }
    await supabase.from('quizzes').delete().eq('course_id', courseId)
    await supabase.from('reviews').delete().eq('course_id', courseId)
    await supabase.from('wishlist').delete().eq('course_id', courseId)
    const { error } = await supabase.from('courses').delete().eq('id', courseId)
    if (error) setMsg({ text: 'فشل حذف الدورة: ' + error.message, type: 'error' })
    else { setMsg({ text: '✅ تم حذف الدورة بنجاح', type: 'success' }); loadCourses() }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const startEdit = (course: any) => {
    setEditingId(course.id)
    setEditTitle(course.title)
    setEditDesc(course.description || '')
  }

  const handleSaveEdit = async (courseId: string) => {
    if (!editTitle.trim()) return
    setSavingEdit(true)
    const { error } = await supabase.from('courses').update({ title: editTitle.trim(), description: editDesc.trim() }).eq('id', courseId)
    if (error) setMsg({ text: 'فشل التعديل: ' + error.message, type: 'error' })
    else { setMsg({ text: '✅ تم تعديل الدورة', type: 'success' }); setEditingId(null); loadCourses() }
    setSavingEdit(false)
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4 transition-colors">
              <ArrowRight className="w-5 h-5" /> العودة للوحة التحكم
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Library className="w-8 h-8" /></div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">إدارة دوراتي</h1>
                <p className="text-slate-500 font-medium">إنشاء وتعديل محتواك التعليمي</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsFormOpen(!isFormOpen)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-sm transition-all ${isFormOpen ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:-translate-y-0.5'}`}>
            {isFormOpen ? <><X className="w-5 h-5" /> إلغاء</> : <><PlusCircle className="w-5 h-5" /> إضافة دورة جديدة</>}
          </button>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'إجمالي الدورات', value: courses.length, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'إجمالي الطلاب المشاركين', value: totalStudents, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'إجمالي الدروس', value: Object.values(courseStats).reduce((a, s) => a + s.lessons, 0), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0`}><Icon className="w-6 h-6" /></div>
                <div>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs font-bold text-slate-400">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Course Form */}
        {isFormOpen && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-indigo-100 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><PlusCircle className="w-6 h-6 text-indigo-600" /> إنشاء دورة جديدة</h2>
            <form onSubmit={handleAddCourse} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الدورة</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: أساسيات البرمجة بلغة بايثون" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">وصف الدورة</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="اكتب وصفاً مختصراً..." rows={4} required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className={`px-8 py-3.5 rounded-xl font-bold text-white shadow-md flex items-center gap-2 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإنشاء...</> : 'تأكيد إنشاء الدورة'}
              </button>
            </form>
          </div>
        )}

        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-bold ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span> {msg.text}
          </div>
        )}

        {/* Courses List */}
        <div>
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div> دوراتك الحالية ({courses.length})
          </h2>
          {loadingCourses ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" /><p className="font-bold text-slate-400">جاري تحميل الإحصائيات...</p></div>
          ) : courses.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><BookOpen className="w-10 h-10 text-indigo-300" /></div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد دورات بعد</h3>
              <p className="text-slate-500">اضغط على "إضافة دورة جديدة" للبدء.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => {
                const stats = courseStats[course.id] || { students: 0, lessons: 0 }
                const isEditing = editingId === course.id
                return (
                  <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 overflow-hidden flex flex-col group">
                    <div className="h-28 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border-b border-slate-100">
                      <BookOpen className="w-10 h-10 text-indigo-200 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      {isEditing ? (
                        <div className="space-y-3 flex-grow">
                          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-800 text-sm"
                            placeholder="عنوان الدورة" />
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-600 text-sm resize-none"
                            placeholder="وصف الدورة" />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(course.id)} disabled={savingEdit}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
                              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-black text-slate-800 mb-2 line-clamp-1">{course.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">{course.description}</p>
                          <div className="flex items-center gap-4 mb-5 py-3 border-y border-slate-50">
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                              <GraduationCap className="w-4 h-4 text-green-500" />
                              <span>{stats.students} طالب</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                              <BookOpen className="w-4 h-4 text-indigo-400" />
                              <span>{stats.lessons} درس</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => navigate(`/instructor/course/${course.id}`)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold rounded-xl transition-colors text-sm">
                              <Edit3 className="w-4 h-4" /> إدارة المحتوى
                            </button>
                            <button onClick={() => startEdit(course)}
                              className="p-2.5 bg-slate-50 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors" title="تعديل بيانات الدورة">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteCourse(course.id, course.title)}
                              className="p-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors" title="حذف الدورة">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
