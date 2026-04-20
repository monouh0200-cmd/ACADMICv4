import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Heart, Loader2 } from 'lucide-react'

export default function WishlistButton({ courseId }: { courseId: string }) {
  const { user } = useAuthStore()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()
      
      setIsWishlisted(!!data)
      setLoading(false)
    }
    checkStatus()
  }, [courseId, user])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation() // منع الانتقال لصفحة الكورس عند الضغط على الزر
    if (!user || toggling) return

    setToggling(true)
    if (isWishlisted) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('course_id', courseId)
      setIsWishlisted(false)
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, course_id: courseId })
      setIsWishlisted(true)
    }
    setToggling(false)
  }

  if (loading) return <div className="p-2"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>

  return (
    <button
      onClick={toggleWishlist}
      className={`p-2.5 rounded-xl transition-all border ${
        isWishlisted 
        ? 'bg-red-50 border-red-100 text-red-500 shadow-sm' 
        : 'bg-white border-slate-100 text-slate-400 hover:text-red-400'
      }`}
    >
      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
    </button>
  )
}