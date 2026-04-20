import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { 
  CheckCircle2, XCircle, ChevronRight, ChevronLeft, Loader2, Trophy, ArrowRight, AlertCircle
} from 'lucide-react'

export default function QuizAttempt() {
  const { quizId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  
  const [loading, setLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 })

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // جلب الاختبار (RLS تتحقق من enrollment تلقائياً)
        const { data: qData, error: qErr } = await supabase.from('quizzes').select('*').eq('id', quizId).single()
        if (qErr || !qData) { setLoading(false); return }

        // التحقق من التسجيل في الدورة
        const { data: enrollment } = await supabase
          .from('enrollments').select('id').eq('user_id', user?.id).eq('course_id', qData.course_id).maybeSingle()
        if (!enrollment) { setLoading(false); return }

        const { data: questionsData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId)
        setQuiz(qData)
        if (questionsData) setQuestions(questionsData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (quizId) fetchQuizData()
  }, [quizId])

  const handleSelectOption = (questionId: string, option: string) => {
    if (isSubmitted) return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    const confirm = window.confirm('هل أنت متأكد من تسليم الإجابات؟')
    if (!confirm) return

    let correctCount = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correctCount++
    })

    const finalScore = {
      correct: correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100)
    }
    
    setScore(finalScore)
    setIsSubmitted(true)

    // تسجيل النتيجة في قاعدة البيانات
    try {
      await supabase.from('quiz_attempts').insert({
        user_id: user?.id,
        quiz_id: quizId,
        score: finalScore.percentage
      })
    } catch (e) {
      console.error('لم نتمكن من حفظ النتيجة في القاعدة', e)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
    </div>
  )

  if (!quiz || questions.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 text-center">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
      <h2 className="text-2xl font-black text-slate-800 mb-2">الاختبار غير متاح</h2>
      <p className="text-slate-500 mb-6">يبدو أن هذا الاختبار لا يحتوي على أسئلة بعد أو تم حذفه.</p>
      <button onClick={() => navigate('/student/courses')} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">العودة للدورات</button>
    </div>
  )

  const currentQ = questions[currentIdx]

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(quiz?.course_id ? `/student/quizzes/${quiz.course_id}` : '/student/courses')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
            <ArrowRight className="w-5 h-5" /> خروج
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-black text-slate-800 line-clamp-1">{quiz.title}</h1>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-black border border-indigo-100 shadow-sm">
            {currentIdx + 1} / {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-8 overflow-hidden">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Result Screen */}
        {isSubmitted ? (
          <div className="bg-white rounded-[2rem] p-10 text-center shadow-xl border border-slate-100 animate-in zoom-in-95">
            <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-white ${score.percentage >= 50 ? 'bg-gradient-to-tr from-green-400 to-emerald-600' : 'bg-gradient-to-tr from-red-400 to-rose-600'}`}>
               {score.percentage >= 50 ? <Trophy className="w-14 h-14 text-white" /> : <XCircle className="w-14 h-14 text-white" />}
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">
              {score.percentage >= 50 ? 'عمل رائع! لقد اجتزت الاختبار' : 'للأسف، لم تجتز الاختبار هذه المرة'}
            </h2>
            <p className="text-slate-500 text-lg mb-8 font-medium">نتيجتك النهائية هي:</p>
            
            <div className="flex justify-center gap-6 mb-10">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-32">
                <span className="block text-3xl font-black text-indigo-600 mb-1">{score.percentage}%</span>
                <span className="text-xs font-bold text-slate-400">النسبة المئوية</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-32">
                <span className="block text-3xl font-black text-slate-700 mb-1">{score.correct}/{score.total}</span>
                <span className="text-xs font-bold text-slate-400">الإجابات الصحيحة</span>
              </div>
            </div>

            <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl w-full md:w-auto transition-all shadow-md">
              العودة للوحة التحكم
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-lg border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-8 leading-relaxed">
              {currentQ.question}
            </h2>
            
            <div className="space-y-4 mb-10">
              {/* الخيارات محفوظة كـ JSON string في CourseEditor، نحتاج parse */}
              {(typeof currentQ.options === 'string' ? JSON.parse(currentQ.options) : (currentQ.options || [])).map((option: string, idx: number) => {
                const isSelected = answers[currentQ.id] === option
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(currentQ.id, option)}
                    className={`w-full text-right p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                  >
                    <span className={`font-bold text-lg ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>{option}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button 
                onClick={() => setCurrentIdx(prev => prev - 1)} 
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-5 h-5" /> السابق
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button 
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < questions.length}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-l from-indigo-600 to-blue-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تسليم الاختبار <CheckCircle2 className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
                >
                  التالي <ChevronLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}