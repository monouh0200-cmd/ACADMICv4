import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MessageCircle, Send, Loader2, Trash2, User, ShieldCheck } from 'lucide-react'

export default function LessonComments({ lessonId }: { lessonId: string }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // جلب التعليقات مع بيانات المستخدم (اسمه وصلاحيته)
  const fetchComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, role)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })
    
    if (data) setComments(data)
    setLoading(false)
  }

  // إعادة الجلب عند تغيير الدرس
  useEffect(() => {
    if (lessonId) fetchComments()
  }, [lessonId])

  // إضافة تعليق جديد
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    
    setSending(true)
    try {
      const { error } = await supabase.from('comments').insert({
        lesson_id: lessonId,
        user_id: user.id,
        content: newComment
      })
      if (error) throw error
      
      setNewComment('')
      fetchComments() // تحديث القائمة لإظهار التعليق الجديد
    } catch (err) {
      console.error('فشل إرسال التعليق:', err)
    } finally {
      setSending(false)
    }
  }

  // حذف التعليق (متاح لصاحب التعليق فقط)
  const handleDelete = async (commentId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) return
    try {
      await supabase.from('comments').delete().eq('id', commentId)
      setComments(comments.filter(c => c.id !== commentId)) // تحديث الواجهة فوراً
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-black text-slate-800">النقاشات والأسئلة ({comments.length})</h3>
      </div>

      {/* نموذج إضافة تعليق */}
      <form onSubmit={handleAddComment} className="mb-10 relative">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="هل لديك سؤال أو استفسار حول هذا الدرس؟ اكتبه هنا..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-4 pl-16 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none min-h-[120px] text-slate-700"
        />
        <button
          type="submit"
          disabled={sending || !newComment.trim()}
          className="absolute bottom-4 left-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -translate-x-0.5" />}
        </button>
      </form>

      {/* قائمة التعليقات */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">لا توجد أسئلة أو نقاشات حتى الآن. كن أول من يشارك!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-slate-100 shadow-sm">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex-1 bg-slate-50 hover:bg-slate-100/50 transition-colors rounded-2xl rounded-tr-none p-5 border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800">{comment.profiles?.username || 'مستخدم'}</span>
                      {comment.profiles?.role === 'instructor' && (
                        <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">
                          <ShieldCheck className="w-3 h-3"/> المدرس
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {new Date(comment.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  {/* زر الحذف يظهر فقط لصاحب التعليق */}
                  {user?.id === comment.user_id && (
                    <button onClick={() => handleDelete(comment.id)} className="text-slate-300 hover:text-red-500 transition-colors bg-white p-1.5 rounded-lg shadow-sm border border-slate-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}