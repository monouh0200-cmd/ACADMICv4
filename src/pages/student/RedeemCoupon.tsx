import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { redeemCouponSchema, getZodError } from '../../lib/schemas'
import { Ticket, Crown, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export default function RedeemCoupon() {
  const { user, profile, checkSession } = useAuthStore()
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const navigate = useNavigate()

  const isAlreadyPremium = profile?.subscription_type === 'premium'

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ text: '', type: '' })

    // ── Zod validation ──────────────────────────────────────
    const parsed = redeemCouponSchema.safeParse({ code: couponCode })
    if (!parsed.success) {
      setMsg({ text: getZodError(parsed.error), type: 'error' })
      return
    }

    setLoading(true)
    try {
      // ── Edge Function: كل التحقق server-side + atomic update ──
      const { data, error } = await api.coupons.redeem(parsed.data.code)
      if (error) {
        setMsg({ text: error, type: 'error' })
        setLoading(false)
        return
      }

      // الـ Edge Function تولّت كل شيء — فقط نحدث الجلسة
      await checkSession()

      setMsg({
        text: data?.message || '🎉 مبروك! تم ترقية حسابك لـ Premium بنجاح.',
        type: 'success'
      })

      setTimeout(() => navigate('/dashboard'), 2500)

    } catch (err: any) {
      setMsg({ text: err.message || 'حدث خطأ أثناء محاولة تفعيل القسيمة.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 py-12" dir="rtl">
      <div className="max-w-xl w-full">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-amber-600 font-bold mb-6 transition-colors bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-100 w-fit">
          <ArrowRight className="w-5 h-5" /> العودة للرئيسية
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10 text-center relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl opacity-20"></div>
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/30 relative z-10 shadow-lg">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3 relative z-10">الترقية للمحتوى المميز</h1>
            <p className="text-amber-100 font-medium relative z-10">أدخل قسيمة الدفع لفتح جميع الدورات والدروس الحصرية.</p>
          </div>

          <div className="p-8 md:p-10">
            {isAlreadyPremium ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3">حسابك مميز بالفعل!</h2>
                <p className="text-slate-500 mb-8 font-medium">أنت تتمتع بجميع مميزات باقة Premium.</p>
                <button onClick={() => navigate('/student/courses')}
                  className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all">
                  الذهاب لمكتبة الدورات
                </button>
              </div>
            ) : (
              <form onSubmit={handleRedeem} className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5" /> دروس حصرية
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> شهادات معتمدة
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
                    <Ticket className="w-3.5 h-3.5" /> وصول غير محدود
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">كود القسيمة</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <Ticket className="w-6 h-6 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input type="text"
                      placeholder="أدخل الكود هنا (مثال: VIP-2026-XYZ)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      required dir="ltr"
                      className="w-full pl-4 pr-14 py-4 rounded-2xl border-2 border-slate-200 focus:border-amber-500 outline-none transition-all text-left bg-slate-50 focus:bg-white font-black text-slate-700 tracking-wider placeholder:font-medium placeholder:tracking-normal" />
                  </div>
                </div>

                <button type="submit" disabled={loading || !couponCode}
                  className={`w-full flex justify-center items-center gap-3 py-4 border border-transparent rounded-2xl shadow-lg text-lg font-black text-white transition-all ${loading || !couponCode ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:-translate-y-1'}`}>
                  {loading ? (<><Loader2 className="w-6 h-6 animate-spin" /> جاري التحقق...</>) : 'تفعيل الحساب المميز'}
                </button>
              </form>
            )}

            {msg.text && (
              <div className={`mt-8 p-5 rounded-2xl flex items-start gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-green-600" /> : <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-600" />}
                <p className="font-bold leading-relaxed">{msg.text}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
