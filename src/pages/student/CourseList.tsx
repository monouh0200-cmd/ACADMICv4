import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import {
  BookOpen, ChevronLeft, Loader2, Library,
  Search, Filter, Star, Clock, CheckCircle2
} from 'lucide-react'
import WishlistButton from '../../components/WishlistButton'

export default function CourseList() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('الكل')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
      if (data) {
        setCourses(data)
        setFilteredCourses(data)

        // جلب التقدم للطالب الحالي
        if (user) {
          const map: Record<string, number> = {}
          await Promise.all(data.map(async (course) => {
            const [{ count: total }, { count: done }] = await Promise.all([
              supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
              supabase.from('user_progress').select('*', { count: 'exact', head: true })
                .eq('user_id', user.id).eq('course_id', course.id).eq('is_completed', true)
            ])
            map[course.id] = total ? Math.round(((done || 0) / total) * 100) : 0
          }))
          setProgressMap(map)
        }
      }
      setLoading(false)
    }
    fetchCourses()
  }, [user])

  useEffect(() => {
    let result = courses
    // فلترة بالاسم
    if (searchTerm) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    // فلترة بالقسم (category column موجود في DB)
    if (activeCategory && activeCategory !== 'الكل') {
      result = result.filter(course =>
        course.category === activeCategory
      )
    }
    setFilteredCourses(result)
  }, [searchTerm, courses, activeCategory])

  const categories = ['الكل', 'برمجة', 'تصميم', 'لغات', 'علوم']

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><Library className="w-8 h-8" /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">مكتبة الدورات</h2>
              <p className="text-slate-500 font-medium">استكشف {courses.length} دورة تدريبية مميزة</p>
            </div>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input type="text" placeholder="ابحث عن دورة معينة..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 shadow-sm transition-all font-medium" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <div className="p-2 bg-slate-100 rounded-lg ml-2"><Filter className="w-5 h-5 text-slate-500" /></div>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
            <p className="text-lg font-bold">جاري تجهيز المحتوى...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl">لم نجد أي نتائج تطابق بحثك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => {
              const pct = progressMap[course.id] ?? -1 // -1 = لم يبدأ بعد
              const started = pct >= 0
              const done = pct === 100

              return (
                <div key={course.id} className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 flex flex-col relative">
                  {/* Wishlist */}
                  <div className="absolute top-4 left-4 z-20"><WishlistButton courseId={course.id} /></div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    {done ? (
                      <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" /> مكتمل
                      </span>
                    ) : started ? (
                      <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-md">{pct}% مكتمل</span>
                    ) : (
                      <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-black text-blue-700 shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-blue-700" /> جديد
                      </span>
                    )}
                  </div>

                  {/* Cover */}
                  <div onClick={() => navigate(`/student/course-details/${course.id}`)}
                    className={`h-48 flex items-center justify-center relative cursor-pointer ${done ? 'bg-gradient-to-br from-green-800 to-emerald-900' : started ? 'bg-gradient-to-br from-blue-800 to-indigo-900' : 'bg-gradient-to-br from-slate-800 to-blue-900'}`}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-blue-600 transition-opacity"></div>
                    <BookOpen className="w-16 h-16 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    {/* Progress bar على الكارت */}
                    {started && !done && (
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10">
                        <div className="h-2 bg-blue-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">دورة مسجلة</span>
                    </div>
                    <h3 onClick={() => navigate(`/student/course-details/${course.id}`)}
                      className="text-xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2 flex-grow">
                      {course.description || 'ابدأ رحلتك في هذا المجال من خلال دروس تعليمية مكثفة.'}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase">الحالة</span>
                        <span className="text-sm font-bold text-slate-700">
                          {done ? '✅ مكتمل' : started ? `${pct}% مكتمل` : 'لم تبدأ بعد'}
                        </span>
                      </div>
                      <button onClick={() => navigate(`/student/course-details/${course.id}`)}
                        className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </div>
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
