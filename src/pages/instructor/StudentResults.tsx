import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, ArrowRight, Loader2, Trophy,
  ChevronDown, ChevronUp, Users, ClipboardList
} from 'lucide-react'

export default function StudentResults() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return }
      setLoading(true)

      // جلب كل الكويزات في دورات هذا المدرس
      const { data: courses } = await supabase
        .from('courses').select('id, title').eq('instructor_id', user.id)

      if (!courses?.length) { setLoading(false); return }

      const courseIds = courses.map(c => c.id)
      const { data: quizzes } = await supabase
        .from('quizzes').select('id, title, course_id').in('course_id', courseIds)

      if (!quizzes?.length) { setLoading(false); return }

      const enriched = await Promise.all(quizzes.map(async (quiz) => {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('score, created_at, user_id, profiles(username)')
          .eq('quiz_id', quiz.id)
          .order('created_at', { ascending: false })

        const course = courses.find(c => c.id === quiz.course_id)
        const scores = (attempts || []).map(a => a.score)
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        const highest = scores.length ? Math.max(...scores) : 0
        const passed = scores.filter(s => s >= 50).length

        return { ...quiz, courseTitle: course?.title, attempts: attempts || [], avg, highest, passed }
      }))

      // ترتيب: الأكثر محاولات أولاً
      enriched.sort((a, b) => b.attempts.length - a.attempts.length)
      setData(enriched)
      setLoading(false)
    }
    fetchData()
  }, [user])

  const totalAttempts = data.reduce((a, q) => a + q.attempts.length, 0)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800">نتائج طلابي في الاختبارات</h1>
            <p className="text-slate-500 font-medium">{totalAttempts} محاولة على مجموع {data.length} اختبار</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <ClipboardList className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-700">لا توجد اختبارات أو محاولات بعد</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map(quiz => {
              const isExp = expandedQuiz === quiz.id
              return (
                <div key={quiz.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  {/* Quiz Header */}
                  <button onClick={() => setExpandedQuiz(isExp ? null : quiz.id)}
                    className="w-full p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors text-right">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-800 text-lg">{quiz.title}</h3>
                      <p className="text-sm text-slate-400 font-bold mt-0.5">📖 {quiz.courseTitle}</p>
                    </div>
                    {/* Stats Chips */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-slate-600">
                        <Users className="w-3.5 h-3.5" /> {quiz.attempts.length} محاولة
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-xl text-xs font-black text-green-700">
                        <Trophy className="w-3.5 h-3.5" /> {quiz.passed} ناجح
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl text-xs font-black text-blue-700">
                        <BarChart3 className="w-3.5 h-3.5" /> متوسط {quiz.avg}%
                      </span>
                    </div>
                    {isExp ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                  </button>

                  {/* Attempts Table */}
                  {isExp && (
                    <div className="border-t border-slate-50">
                      {quiz.attempts.length === 0 ? (
                        <p className="text-center py-8 text-slate-400 font-bold">لا توجد محاولات بعد</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-right p-4 font-black text-slate-500 text-xs">الطالب</th>
                                <th className="text-center p-4 font-black text-slate-500 text-xs">الدرجة</th>
                                <th className="text-center p-4 font-black text-slate-500 text-xs">النتيجة</th>
                                <th className="text-center p-4 font-black text-slate-500 text-xs">التاريخ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {quiz.attempts.map((a: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 font-bold text-slate-700">{a.profiles?.username || 'طالب'}</td>
                                  <td className="p-4 text-center">
                                    <span className={`font-black text-lg ${a.score >= 80 ? 'text-green-600' : a.score >= 50 ? 'text-blue-600' : 'text-red-500'}`}>
                                      {a.score}%
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${a.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {a.score >= 80 ? 'ممتاز' : a.score >= 60 ? 'جيد' : a.score >= 50 ? 'مقبول' : 'راسب'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center text-slate-400 font-bold text-xs">
                                    {new Date(a.created_at).toLocaleDateString('ar-EG')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
