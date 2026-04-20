import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, Trophy, CheckCircle2, Circle, PlayCircle, BarChart3 } from 'lucide-react'
import { SkeletonRow } from '../../components/Skeleton'

function getProgressColor(p: number) {
  if (p === 100) return 'bg-green-500'
  if (p >= 60)  return 'bg-blue-500'
  if (p >= 30)  return 'bg-amber-500'
  return 'bg-slate-300'
}

export default function MyCourses() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [myCourses, setMyCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)

      // ✅ يستخدم جدول enrollments الحقيقي بدل user_progress
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })

      if (!enrollments || enrollments.length === 0) { setLoading(false); return }

      const courseIds = enrollments.map(e => e.course_id)
      const { data: coursesData } = await supabase.from('courses').select('*').in('id', courseIds)
      if (!coursesData) { setLoading(false); return }

      const enriched = await Promise.all(coursesData.map(async (course) => {
        const [{ count: total }, { count: done }] = await Promise.all([
          supabase.from('lessons').select('*',{count:'exact',head:true}).eq('course_id', course.id),
          supabase.from('user_progress').select('*',{count:'exact',head:true})
            .eq('user_id', user.id).eq('course_id', course.id).eq('is_completed', true)
        ])
        const t = total || 0
        const d = done || 0
        const enroll = enrollments.find(e => e.course_id === course.id)
        return { ...course, totalLessons: t, completedLessons: d, percentage: t ? Math.round((d/t)*100) : 0, enrolledAt: enroll?.enrolled_at }
      }))

      setMyCourses(enriched)
      setLoading(false)
    }
    load()
  }, [user])

  const completed = myCourses.filter(c => c.percentage === 100).length
  const inProgress = myCourses.filter(c => c.percentage > 0 && c.percentage < 100).length

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl" style={{ color:'var(--text-secondary)' }}>
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black" style={{ color:'var(--text-primary)' }}>دوراتي</h1>
            <p className="text-sm font-bold" style={{ color:'var(--text-secondary)' }}>الدورات التي سجلت فيها</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({length:4}).map((_,i) => <SkeletonRow key={i} />)}</div>
        ) : myCourses.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor:'var(--border-color)' }}>
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color:'var(--border-color)' }} />
            <h2 className="text-xl font-black mb-2" style={{ color:'var(--text-primary)' }}>لم تسجل في أي دورة بعد</h2>
            <button onClick={() => navigate('/student/courses')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">تصفح الدورات</button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label:'إجمالي الدورات',  val:myCourses.length, icon:BookOpen,   color:'text-blue-600', bg:'bg-blue-50' },
                { label:'قيد التعلم',       val:inProgress,       icon:BarChart3,  color:'text-amber-600',bg:'bg-amber-50' },
                { label:'مكتملة',           val:completed,        icon:Trophy,     color:'text-green-600',bg:'bg-green-50' },
              ].map((s,i) => (
                <div key={i} className="rounded-2xl p-4 border flex items-center gap-3" style={{ background:'var(--bg-card)', borderColor:'var(--border-color)' }}>
                  <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-xs font-bold" style={{ color:'var(--text-secondary)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {myCourses.map(course => (
                <div key={course.id}
                  className="rounded-2xl border overflow-hidden transition-all hover:shadow-md"
                  style={{ background:'var(--bg-card)', borderColor:'var(--border-color)' }}>
                  <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${course.percentage===100?'bg-green-100':'bg-blue-50'}`}>
                      {course.percentage===100 ? <Trophy className="w-7 h-7 text-green-600" /> : <BookOpen className="w-7 h-7 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-black text-lg" style={{ color:'var(--text-primary)' }}>{course.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${course.percentage===100?'bg-green-100 text-green-700':'bg-blue-50 text-blue-600'}`}>
                          {course.percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background:'var(--border-color)' }}>
                        <div className={`h-full rounded-full transition-all ${getProgressColor(course.percentage)}`} style={{ width:`${course.percentage}%` }} />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold" style={{ color:'var(--text-muted)' }}>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{course.completedLessons} مكتمل</span>
                        <span className="flex items-center gap-1"><Circle className="w-3.5 h-3.5" />{course.totalLessons - course.completedLessons} متبقي</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {course.percentage===100 && (
                        <button onClick={() => navigate(`/student/certificate/${course.id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 font-bold rounded-xl text-xs border border-amber-200 transition-all">
                          <Trophy className="w-3.5 h-3.5" /> الشهادة
                        </button>
                      )}
                      <button onClick={() => navigate(`/student/course/${course.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors">
                        <PlayCircle className="w-3.5 h-3.5" />
                        {course.percentage===100?'مراجعة':course.percentage===0?'ابدأ':'كمّل'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
