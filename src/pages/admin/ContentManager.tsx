import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowRight, Loader2, Lock, Unlock, BookOpen, CheckCircle2, XCircle, Crown } from 'lucide-react'

export default function ContentManager() {
  const [courses, setCourses] = useState<any[]>([])
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, any[]>>({})
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const navigate = useNavigate()

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 2500)
  }

  const loadData = async () => {
    setLoading(true)
    const { data: coursesData } = await supabase.from('courses').select('id, title, is_premium').order('created_at', { ascending: false })
    if (coursesData) {
      setCourses(coursesData)
      const map: Record<string, any[]> = {}
      for (const c of coursesData) {
        const { data: lessons } = await supabase.from('lessons').select('id, title, is_premium, order_index').eq('course_id', c.id).order('order_index', { ascending: true })
        map[c.id] = lessons || []
      }
      setLessonsByCourse(map)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // تغيير حالة الدورة كاملة (بريميوم/مجاني) وكل دروسها
  const handleToggleCoursePremium = async (courseId: string, current: boolean) => {
    const newVal = !current
    await supabase.from('courses').update({ is_premium: newVal }).eq('id', courseId)
    await supabase.from('lessons').update({ is_premium: newVal }).eq('course_id', courseId)
    showMsg(`✅ تم تحويل الدورة ${newVal ? 'لبريميوم' : 'لمجانية'} مع جميع دروسها`, 'success')
    loadData()
  }

  // تغيير درس واحد فقط (مختلط)
  const handleToggleLessonPremium = async (lessonId: string, courseId: string, current: boolean) => {
    await supabase.from('lessons').update({ is_premium: !current }).eq('id', lessonId)
    // تحديث محلي سريع
    setLessonsByCourse(prev => ({
      ...prev,
      [courseId]: prev[courseId].map(l => l.id === lessonId ? { ...l, is_premium: !current } : l)
    }))
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800">إدارة المحتوى والوصول</h1>
            <p className="text-slate-500 font-medium">تحديد الدورات والدروس المدفوعة أو المجانية بشكل مرن</p>
          </div>
        </div>

        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl font-bold flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />} {msg.text}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-wrap gap-4 text-sm font-bold">
          <div className="flex items-center gap-2 text-amber-600"><Crown className="w-4 h-4" /> دورة بريميوم كاملة = جميع دروسها مدفوعة</div>
          <div className="flex items-center gap-2 text-green-600"><Unlock className="w-4 h-4" /> دورة مجانية = جميع دروسها مجانية</div>
          <div className="flex items-center gap-2 text-blue-600"><BookOpen className="w-4 h-4" /> دورة مختلطة = بعض الدروس مدفوعة والبعض مجاني</div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-500 text-xl">لا توجد دورات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(course => {
              const lessons = lessonsByCourse[course.id] || []
              const premiumCount = lessons.filter(l => l.is_premium).length
              const freeCount = lessons.length - premiumCount
              const isMixed = premiumCount > 0 && freeCount > 0
              const isExpanded = expandedCourse === course.id

              return (
                <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  {/* Course Header */}
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-800 text-lg">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs font-bold">
                        <span className="text-slate-400">{lessons.length} درس</span>
                        {isMixed ? (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">🔀 مختلط ({premiumCount} مدفوع + {freeCount} مجاني)</span>
                        ) : course.is_premium ? (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⭐ بريميوم كامل</span>
                        ) : (
                          <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">🆓 مجاني كامل</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* زرار تحويل الدورة كاملة */}
                      <button onClick={() => handleToggleCoursePremium(course.id, !!course.is_premium)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${course.is_premium ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600'}`}>
                        {course.is_premium ? <><Lock className="w-4 h-4" /> كل الدروس بريميوم</> : <><Unlock className="w-4 h-4" /> كل الدروس مجانية</>}
                      </button>
                      {/* زرار التخصيص الفردي */}
                      <button onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
                        {isExpanded ? 'إخفاء' : 'تخصيص فردي'}
                      </button>
                    </div>
                  </div>

                  {/* Individual Lessons */}
                  {isExpanded && (
                    <div className="border-t border-slate-50 bg-slate-50 p-5 space-y-2">
                      <p className="text-sm font-bold text-slate-500 mb-3">اضغط على أي درس لتغيير حالته بشكل مستقل (دورة مختلطة):</p>
                      {lessons.length === 0 ? (
                        <p className="text-slate-400 text-sm font-bold text-center py-4">لا توجد دروس في هذه الدورة</p>
                      ) : lessons.map((lesson, idx) => (
                        <div key={lesson.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <span className="font-bold text-slate-700 text-sm">{idx + 1}. {lesson.title || 'درس بدون عنوان'}</span>
                          </div>
                          <button
                            onClick={() => handleToggleLessonPremium(lesson.id, course.id, lesson.is_premium)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${lesson.is_premium ? 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white' : 'bg-green-100 text-green-700 hover:bg-green-500 hover:text-white'}`}>
                            {lesson.is_premium ? <><Lock className="w-3.5 h-3.5" /> مدفوع</> : <><Unlock className="w-3.5 h-3.5" /> مجاني</>}
                          </button>
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
    </div>
  )
}
