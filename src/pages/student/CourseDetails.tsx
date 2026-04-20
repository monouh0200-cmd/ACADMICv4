import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import {
  BookOpen, Users, Star, Play, Lock, CheckCircle2,
  ChevronDown, ChevronUp, ArrowRight, Loader2, Crown, Award
} from 'lucide-react'
import WishlistButton from '../../components/WishlistButton'

export default function CourseDetails() {
  const { courseId } = useParams()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [instructor, setInstructor] = useState<any>(null)
  const [rating, setRating] = useState({ avg: 0, count: 0 })
  const [studentCount, setStudentCount] = useState(0)
  const [progressPct, setProgressPct] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!courseId) return
      try {
        const [{ data: c }, { data: l }] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase.from('lessons').select('id,title,is_premium,order_index').eq('course_id', courseId).order('order_index'),
        ])
        if (c) {
          setCourse(c)
          // جلب بيانات المدرس
          if (c.instructor_id) {
            const { data: instr } = await supabase.from('profiles')
              .select('username,full_name,specialization,title').eq('id', c.instructor_id).maybeSingle()
            if (instr) setInstructor(instr)
          }
        }
        if (l) setLessons(l)

        // التقييم
        const { data: rData } = await supabase.from('reviews').select('rating').eq('course_id', courseId)
        if (rData && rData.length > 0) {
          const avg = rData.reduce((s: number, r: any) => s + r.rating, 0) / rData.length
          setRating({ avg: Math.round(avg * 10) / 10, count: rData.length })
        }

        // عدد الطلاب الفريدين
        const { data: progData } = await supabase.from('enrollments').select('user_id').eq('course_id', courseId)
        if (progData) {
          setStudentCount(new Set(progData.map((p: any) => p.user_id)).size)
        }

        // تقدم الطالب الحالي
        if (user && l) {
          const { count: done } = await supabase.from('user_progress').select('*', { count: 'exact', head: true })
            .eq('user_id', user.id).eq('course_id', courseId).eq('is_completed', true)
          setProgressPct(l.length ? Math.round(((done || 0) / l.length) * 100) : 0)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [courseId, user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">
      الدورة غير موجودة
    </div>
  )

  const freeLessons = lessons.filter(l => !l.is_premium).length
  const isPremium = profile?.subscription_type === 'premium'

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/student/courses')}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors font-bold">
            <ArrowRight className="w-5 h-5" /> العودة للمكتبة
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{course.title}</h1>
              <p className="text-slate-300 font-medium mb-6 leading-relaxed text-lg">{course.description}</p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                {rating.count > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Star className="w-4 h-4" fill="currentColor" />
                    {rating.avg} ({rating.count} تقييم)
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4" /> {studentCount} طالب
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <BookOpen className="w-4 h-4" /> {lessons.length} درس
                </span>
                {instructor && (
                  <span className="flex items-center gap-1.5 text-blue-300">
                    المدرس: {instructor.full_name || instructor.username}
                  </span>
                )}
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl text-slate-800">
              {progressPct > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                    <span>تقدمك في الدورة</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              <button onClick={() => navigate(`/student/course/${courseId}`)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 mb-3 flex items-center justify-center gap-2 text-lg">
                <Play className="w-5 h-5" />
                {progressPct > 0 ? 'متابعة التعلم' : 'ابدأ الدورة الآن'}
              </button>

              {progressPct === 100 && (
                <button onClick={() => navigate(`/student/certificate/${courseId}`)}
                  className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black rounded-2xl transition-all flex items-center justify-center gap-2 mb-3">
                  <Award className="w-5 h-5" /> استخراج الشهادة
                </button>
              )}

              <div className="flex items-center justify-between mt-2">
                <WishlistButton courseId={courseId!} />
                {!isPremium && lessons.some(l => l.is_premium) && (
                  <button onClick={() => navigate('/student/redeem')}
                    className="flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700">
                    <Crown className="w-4 h-4" /> ترقية للبريميوم
                  </button>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>الدروس المجانية</span><span className="font-black text-slate-700">{freeLessons}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>الدروس الحصرية</span><span className="font-black text-amber-600">{lessons.length - freeLessons}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Lessons List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpandedSection(!expandedSection)}
              className="w-full flex items-center justify-between p-6 font-black text-slate-800 text-lg hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> محتوى الدورة ({lessons.length} درس)</span>
              {expandedSection ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {expandedSection && (
              <div className="divide-y divide-slate-50">
                {lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-500 shrink-0">{idx + 1}</span>
                    <span className="flex-1 text-sm font-bold text-slate-700">{lesson.title}</span>
                    {lesson.is_premium && !isPremium
                      ? <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      : <CheckCircle2 className="w-4 h-4 text-slate-200 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructor Info */}
        {instructor && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 h-fit">
            <h3 className="font-black text-slate-800 mb-4 text-lg">عن المدرس</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                {(instructor.full_name || instructor.username || '?').charAt(0)}
              </div>
              <div>
                <div className="font-black text-slate-800">{instructor.full_name || instructor.username}</div>
                {instructor.title && <div className="text-sm text-blue-600 font-bold">{instructor.title}</div>}
              </div>
            </div>
            {instructor.specialization && (
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{instructor.specialization}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
