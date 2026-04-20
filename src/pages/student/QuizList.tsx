import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import {
  ClipboardList, ArrowRight, Loader2, Trophy,
  PlayCircle, CheckCircle2, RotateCcw, AlertCircle
} from 'lucide-react'

export default function QuizList() {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) { setLoading(false); return }
      setLoading(true)

      // التحقق من التسجيل — RLS ستمنع الوصول لكن نتحقق مبكراً لتجربة مستخدم أفضل
      const { data: enrollment } = await supabase
        .from('enrollments').select('id').eq('user_id', user?.id).eq('course_id', courseId).maybeSingle()
      if (!enrollment) { setLoading(false); return }

      const [{ data: quizzesData }, { data: attemptsData }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('course_id', courseId).order('created_at', { ascending: true }),
        supabase.from('quiz_attempts').select('quiz_id, score').eq('user_id', user?.id).order('created_at', { ascending: false })
      ])

      if (quizzesData) setQuizzes(quizzesData)

      // آخر درجة لكل اختبار
      if (attemptsData) {
        const map: Record<string, number> = {}
        attemptsData.forEach(a => {
          if (!(a.quiz_id in map)) map[a.quiz_id] = a.score
        })
        setAttempts(map)
      }

      setLoading(false)
    }
    fetchData()
  }, [courseId, user])

  const getScoreStyle = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'ممتاز' }
    if (score >= 60) return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'جيد' }
    if (score >= 50) return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'مقبول' }
    return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'راسب' }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10" dir="rtl">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(`/student/course/${courseId}`)}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-600" /> اختبارات الدورة
            </h1>
            <p className="text-slate-500 font-medium text-sm">اختبر معلوماتك واعرف نتيجتك</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-500 text-xl">لا توجد اختبارات متاحة حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map(q => {
              const hasAttempt = q.id in attempts
              const score = attempts[q.id]
              const style = hasAttempt ? getScoreStyle(score) : null
              const passed = hasAttempt && score >= 50

              return (
                <div key={q.id} className={`bg-white rounded-[2rem] border-2 shadow-sm overflow-hidden transition-all hover:shadow-md ${hasAttempt ? (passed ? 'border-green-100' : 'border-red-100') : 'border-slate-100'}`}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${hasAttempt ? (passed ? 'bg-green-100' : 'bg-red-100') : 'bg-indigo-50'}`}>
                      {hasAttempt
                        ? passed ? <Trophy className="w-7 h-7 text-green-600" /> : <AlertCircle className="w-7 h-7 text-red-500" />
                        : <ClipboardList className="w-7 h-7 text-indigo-500" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-black text-slate-800 text-lg mb-1">{q.title}</h3>

                      {hasAttempt ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black border ${style!.bg} ${style!.text}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            آخر درجة: {score}% — {style!.label}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">يمكنك إعادة المحاولة</span>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm font-bold">لم تؤدِ هذا الاختبار بعد</p>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => navigate(`/student/quiz/${q.id}`)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md shrink-0 ${hasAttempt ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}>
                      {hasAttempt ? <><RotateCcw className="w-4 h-4" /> إعادة المحاولة</> : <><PlayCircle className="w-4 h-4" /> ابدأ الاختبار</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
