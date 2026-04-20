import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Loader2, Trophy,
  CheckCircle2, XCircle, RotateCcw, ClipboardList
} from 'lucide-react'

export default function MyResults() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes!quiz_attempts_quiz_id_fkey(title, course_id, courses!quizzes_course_id_fkey(title))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setResults(data)
      setLoading(false)
    }
    fetchResults()
  }, [user])

  const getStyle = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'ممتاز', icon: Trophy, iconColor: 'text-green-600' }
    if (score >= 60) return { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'جيد', icon: CheckCircle2, iconColor: 'text-blue-600' }
    if (score >= 50) return { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'مقبول', icon: CheckCircle2, iconColor: 'text-amber-500' }
    return { bg: 'bg-red-50 border-red-100', badge: 'bg-red-100 text-red-700', label: 'راسب', icon: XCircle, iconColor: 'text-red-500' }
  }

  const avgScore = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0
  const passed = results.filter(r => r.score >= 50).length

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10" dir="rtl">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800">نتائج اختباراتي</h1>
            <p className="text-slate-500 font-medium">سجل جميع محاولاتك ودرجاتك</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <ClipboardList className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-700 mb-3">لم تؤدِ أي اختبار بعد</h2>
            <button onClick={() => navigate('/student/courses')}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg mt-4">
              تصفح الدورات
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'إجمالي المحاولات', value: results.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'ناجح', value: passed, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'متوسط الدرجات', value: `${avgScore}%`, color: avgScore >= 50 ? 'text-blue-600' : 'text-red-600', bg: avgScore >= 50 ? 'bg-blue-50' : 'bg-red-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {results.map((r, idx) => {
                const style = getStyle(r.score)
                const Icon = style.icon
                return (
                  <div key={r.id} className={`bg-white rounded-2xl border-2 ${style.bg} shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${style.badge}`}>
                      <Icon className={`w-7 h-7 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-800 text-lg">{(r.quizzes as any)?.title || 'اختبار'}</h3>
                      <p className="text-sm text-slate-400 font-bold mt-0.5">
                        📖 {(r.quizzes as any)?.courses?.title || 'دورة'}
                      </p>
                      <p className="text-xs text-slate-300 font-bold mt-1">
                        {new Date(r.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className={`text-4xl font-black ${style.iconColor}`}>{r.score}%</p>
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${style.badge}`}>{style.label}</span>
                      </div>
                      {(r.quizzes as any)?.course_id && (
                        <button onClick={() => navigate(`/student/quizzes/${(r.quizzes as any)?.course_id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
                          <RotateCcw className="w-4 h-4" /> إعادة
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
