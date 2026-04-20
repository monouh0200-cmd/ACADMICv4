import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { 
  ArrowRight, Lock, 
  CheckCircle, Circle, CheckCircle2, Menu, X, Loader2, Trophy, ClipboardList 
} from 'lucide-react'
import LessonComments from '../../components/LessonComments'
import CourseRating from '../../components/CourseRating'

export default function CourseView() {
  const { courseId } = useParams()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [progress, setProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !user) { setLoading(false); return }
      try {
        const { data: cData } = await supabase.from('courses').select('*').eq('id', courseId).single()
        const { data: lData } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index', { ascending: true })
        
        const { data: pData } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('is_completed', true)

        if (cData) setCourse(cData)
        if (lData) {
          setLessons(lData)
          setActiveLesson(lData[0])
        }

        // Auto-enroll عبر Edge Function — تتحقق من premium وتمنع الـ bypass
        if (user && courseId) {
          const { data: existingEnroll } = await supabase
            .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle()
          if (!existingEnroll) {
            const { data: sessionData } = await supabase.auth.getSession()
            const token = sessionData.session?.access_token
            if (token) {
              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enroll-course`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ course_id: courseId })
              })
            }
          }
        }
        
        if (pData) {
          const progMap: Record<string, boolean> = {}
          pData.forEach(p => progMap[p.lesson_id] = true)
          setProgress(progMap)
        }
      } catch (err) {
        console.error('Error fetching course:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId, user])

  const handleToggleComplete = async (lessonId: string) => {
    const isCurrentlyCompleted = progress[lessonId]
    setProgress(prev => ({ ...prev, [lessonId]: !isCurrentlyCompleted }))

    try {
      if (!isCurrentlyCompleted) {
        await supabase.from('user_progress').insert({
          user_id: user?.id,
          course_id: courseId,
          lesson_id: lessonId,
          is_completed: true
        })
      } else {
        await supabase.from('user_progress').delete()
          .eq('user_id', user?.id)
          .eq('lesson_id', lessonId)
      }
    } catch (e) {
      console.error("فشل تحديث التقدم", e)
      setProgress(prev => ({ ...prev, [lessonId]: isCurrentlyCompleted }))
    }
  }

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalLessons = lessons.length
  const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

  const getEmbedUrl = (url: string | null) => {
    if (!url) return ''
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : url
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
    </div>
  )
  
  const isPremiumLocked = (lesson: any) => Boolean(lesson.is_premium) && profile?.subscription_type !== 'premium'

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden" dir="rtl">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => navigate('/student/courses')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"><ArrowRight className="w-6 h-6" /></button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-slate-800 line-clamp-1">{course?.title}</h1>
            <div className="flex items-center gap-3 mt-1 hidden md:flex">
              <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <span className="text-xs font-bold text-slate-500">{progressPercentage}% مكتمل</span>
            </div>
          </div>
        </div>
        
        {progressPercentage === 100 && (
           <button 
             onClick={() => navigate(`/student/certificate/${courseId}`)}
             className="hidden md:flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 rounded-full text-sm font-black shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
           >
             <Trophy className="w-4 h-4" /> استخراج الشهادة
           </button>
        )}

        <button
          onClick={() => navigate(`/student/quizzes/${courseId}`)}
          className="hidden md:flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-black shadow-md transition-all hover:-translate-y-0.5"
        >
          <ClipboardList className="w-4 h-4" /> اختبارات الدورة
        </button>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-bold hidden">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />} قائمة الدروس
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
          {activeLesson ? (
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
              {isPremiumLocked(activeLesson) ? (
                <div className="aspect-video bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-center p-8 border-2 border-amber-500/20 shadow-2xl">
                  <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6"><Lock className="w-10 h-10" /></div>
                  <h2 className="text-2xl font-black text-white mb-2">محتوى بريميوم</h2>
                  <button onClick={() => navigate('/student/redeem')} className="px-8 py-3 bg-amber-500 text-white font-black rounded-2xl">ترقية الحساب</button>
                </div>
              ) : (
                <>
                  <div className="aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
                    <iframe src={getEmbedUrl(activeLesson.video_url)} className="w-full h-full border-0" allowFullScreen></iframe>
                  </div>

                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1 text-right">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">{activeLesson.title}</h2>
                        <button 
                          onClick={() => handleToggleComplete(activeLesson.id)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all border-2 ${progress[activeLesson.id] ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                          {progress[activeLesson.id] ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          {progress[activeLesson.id] ? 'تم الإكمال' : 'تحديد كمكتمل'}
                        </button>
                      </div>
                      {activeLesson.file_url && (
                        <a href={activeLesson.file_url} target="_blank" className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-2xl shrink-0">تحميل المرفقات</a>
                      )}
                    </div>
                  </div>

                  <LessonComments lessonId={activeLesson.id} />
                  
                  {/* يظهر التقييم فقط إذا أكمل الطالب جزءاً كبيراً من الدورة */}
                  {progressPercentage >= 50 && <CourseRating courseId={courseId!} />}
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-bold">اختر درساً للبدء</div>
          )}
        </main>

        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-full md:w-96' : 'w-0'} bg-white border-l border-slate-100 flex flex-col transition-all duration-300 absolute inset-0 z-40 md:relative`}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800">محتوى الدورة</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2"><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => {setActiveLesson(lesson); if(window.innerWidth < 768) setIsSidebarOpen(false)}}
                className={`w-full text-right p-4 rounded-2xl flex items-center justify-between border-2 ${activeLesson?.id === lesson.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-transparent text-slate-600'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-black">{idx + 1}</span>
                  <span className="text-sm font-black line-clamp-1">{lesson.title}</span>
                </div>
                {progress[lesson.id] && <CheckCircle className={`w-5 h-5 ${activeLesson?.id === lesson.id ? 'text-white' : 'text-green-500'}`} />}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}