import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Star, Send, Loader2, CheckCircle } from 'lucide-react'

export default function CourseRating({ courseId }: { courseId: string }) {
  const { user } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !user) return

    setLoading(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        course_id: courseId,
        user_id: user.id,
        rating,
        comment
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('فشل إرسال التقييم:', err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-in zoom-in">
      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
      <p className="text-green-800 font-bold">شكراً لك! تم إرسال تقييمك بنجاح.</p>
    </div>
  )

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm mt-8">
      <h3 className="text-xl font-black text-slate-800 mb-4">ما رأيك في هذه الدورة؟</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform active:scale-90"
            >
              <Star 
                className={`w-8 h-8 ${star <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
              />
            </button>
          ))}
          <span className="mr-3 text-slate-400 font-bold text-sm">
            {rating > 0 ? `${rating} من 5` : 'اختر التقييم'}
          </span>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب تجريتك مع هذه الدورة (اختياري)..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-indigo-500 outline-none transition-all resize-none h-24"
        />

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> إرسال التقييم</>}
        </button>
      </form>
    </div>
  )
}