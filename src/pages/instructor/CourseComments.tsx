import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, ArrowRight, Loader2, Send,
  Trash2, ShieldCheck, User, ChevronDown, ChevronUp, Search
} from 'lucide-react'

export default function CourseComments() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [grouped, setGrouped] = useState<any[]>([]) // [{ course, lessons: [{ lesson, comments }] }]
  const [loading, setLoading] = useState(true)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchComments = async () => {
      if (!user) { setLoading(false); return }
      setLoading(true)

      // جلب دورات المدرس
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })

      if (!courses || courses.length === 0) { setLoading(false); return }

      const result = []
      for (const course of courses) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title')
          .eq('course_id', course.id)
          .order('order_index', { ascending: true })

        if (!lessons?.length) continue

        const lessonsWithComments = []
        for (const lesson of lessons) {
          const { data: comments } = await supabase
            .from('comments')
            .select('*, profiles(username, role)')
            .eq('lesson_id', lesson.id)
            .order('created_at', { ascending: true })

          if (comments && comments.length > 0) {
            lessonsWithComments.push({ ...lesson, comments })
          }
        }

        if (lessonsWithComments.length > 0) {
          result.push({ ...course, lessons: lessonsWithComments })
        }
      }

      setGrouped(result)
      setLoading(false)
    }
    fetchComments()
  }, [user])

  const handleReply = async (lessonId: string, courseIdx: number, lessonIdx: number) => {
    const text = replyText[lessonId]?.trim()
    if (!text || !user) return
    setSending(lessonId)
    try {
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({ lesson_id: lessonId, user_id: user.id, content: text })
        .select('*, profiles(username, role)')
        .single()
      if (error) throw error

      setGrouped(prev => {
        const updated = [...prev]
        updated[courseIdx].lessons[lessonIdx].comments.push(newComment)
        return updated
      })
      setReplyText(prev => ({ ...prev, [lessonId]: '' }))
    } catch (e) {
      console.error(e)
    } finally {
      setSending(null)
    }
  }

  const handleDelete = async (commentId: string, lessonId: string, courseIdx: number, lessonIdx: number) => {
    if (!confirm('هل تريد حذف هذا التعليق؟')) return
    await supabase.from('comments').delete().eq('id', commentId)
    setGrouped(prev => {
      const updated = [...prev]
      updated[courseIdx].lessons[lessonIdx].comments =
        updated[courseIdx].lessons[lessonIdx].comments.filter((c: any) => c.id !== commentId)
      return updated
    })
  }

  const totalComments = grouped.reduce((a, c) => a + c.lessons.reduce((b: number, l: any) => b + l.comments.length, 0), 0)

  const filteredGrouped = grouped.map(course => ({
    ...course,
    lessons: course.lessons.map((lesson: any) => ({
      ...lesson,
      comments: lesson.comments.filter((c: any) =>
        !search || c.content?.toLowerCase().includes(search.toLowerCase()) ||
        c.profiles?.username?.toLowerCase().includes(search.toLowerCase())
      )
    })).filter((l: any) => l.comments.length > 0)
  })).filter(c => c.lessons.length > 0)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-800">تعليقات دوراتي</h1>
            <p className="text-slate-500 font-medium">{totalComments} تعليق على دروسك — يمكنك الرد والحذف</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="ابحث في التعليقات..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 shadow-sm text-sm font-medium" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : filteredGrouped.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <MessageCircle className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-700 mb-2">{search ? 'لا توجد نتائج' : 'لا توجد تعليقات بعد'}</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGrouped.map((course, ci) => (
              <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {/* Course Header */}
                <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h2 className="font-black text-indigo-900 text-lg">{course.title}</h2>
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-black mr-auto">
                    {course.lessons.reduce((a: number, l: any) => a + l.comments.length, 0)} تعليق
                  </span>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-slate-50">
                  {course.lessons.map((lesson: any, li: number) => {
                    const isExp = expandedLesson === lesson.id
                    return (
                      <div key={lesson.id}>
                        <button onClick={() => setExpandedLesson(isExp ? null : lesson.id)}
                          className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors text-right">
                          <div className="flex-1">
                            <p className="font-black text-slate-700">{lesson.title}</p>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">{lesson.comments.length} تعليق</p>
                          </div>
                          {isExp ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>

                        {isExp && (
                          <div className="bg-slate-50 p-5 space-y-4">
                            {/* Comments */}
                            {lesson.comments.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shrink-0">
                                  {comment.profiles?.role === 'instructor'
                                    ? <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                    : <User className="w-4 h-4 text-slate-400" />}
                                </div>
                                <div className="flex-1 bg-white rounded-2xl rounded-tr-none p-4 border border-slate-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-slate-800 text-sm">{comment.profiles?.username || 'مستخدم'}</span>
                                      {comment.profiles?.role === 'instructor' && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">المدرس</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-slate-400 font-bold">
                                        {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                                      </span>
                                      <button onClick={() => handleDelete(comment.id, lesson.id, ci, li)}
                                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                              </div>
                            ))}

                            {/* Reply Box */}
                            <div className="flex gap-3 mt-2">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 relative">
                                <textarea
                                  value={replyText[lesson.id] || ''}
                                  onChange={e => setReplyText(prev => ({ ...prev, [lesson.id]: e.target.value }))}
                                  placeholder="اكتب ردك كمدرس على هذا الدرس..."
                                  className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-4 pl-14 focus:outline-none focus:border-indigo-500 transition-all resize-none min-h-[80px] text-slate-700 text-sm"
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(lesson.id, ci, li) } }}
                                />
                                <button
                                  onClick={() => handleReply(lesson.id, ci, li)}
                                  disabled={!replyText[lesson.id]?.trim() || sending === lesson.id}
                                  className="absolute bottom-3 left-3 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-40">
                                  {sending === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
