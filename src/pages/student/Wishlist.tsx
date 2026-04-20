import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Heart, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import WishlistButton from '../../components/WishlistButton'

export default function Wishlist() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return
      const { data } = await supabase
        .from('wishlist')
        .select('course_id, courses(*)')
        .eq('user_id', user.id)
      
      if (data) setItems(data.map(i => i.courses))
      setLoading(false)
    }
    fetchWishlist()
  }, [user])

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-3xl font-black text-slate-800">قائمة المفضلة</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-xl">قائمة المفضلة فارغة حالياً</p>
            <button onClick={() => navigate('/student/courses')} className="mt-6 text-blue-600 font-black">استعرض الدورات المتاحة</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map(course => (
              <div key={course.id} className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
                <div className="absolute top-6 left-6 z-10">
                  <WishlistButton courseId={course.id} />
                </div>
                <div className="aspect-video rounded-[2rem] overflow-hidden mb-6">
                  <img src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 px-2">{course.title}</h3>
                <div className="flex items-center justify-between mt-6 px-2">
                  <button onClick={() => navigate(`/student/course/${course.id}`)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-colors">عرض التفاصيل</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}