import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  UserPlus, User, Mail, Lock, Phone, 
  Briefcase, Calendar, GraduationCap, Star, Ticket,
  Loader2, CheckCircle2, AlertCircle, BookOpen
} from 'lucide-react'
import { registerSchema, getZodError } from '../../lib/schemas'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<'student' | 'instructor'>('student')
  
  const [specialization, setSpecialization] = useState('')
  const [title, setTitle] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const [studyYear, setStudyYear] = useState('')
  const [subscriptionType, setSubscriptionType] = useState<'free' | 'premium'>('free')
  const [paymentCoupon, setPaymentCoupon] = useState('')

  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ text: '', type: '' })

    // ── Zod validation ─────────────────────────────────────
    const formData = role === 'student'
      ? { role, username, email, password, whatsapp, study_year: studyYear, subscription_type: subscriptionType, payment_coupon: paymentCoupon }
      : { role, username, email, password, whatsapp, specialization, title, hire_date: hireDate }

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      setMsg({ text: getZodError(result.error), type: 'error' })
      return
    }

    setLoading(true)
    try {
      // ── التحقق من الكوبون عبر Edge Function (RLS تمنع قراءة coupons مباشرة) ──
      let couponData: { coupon_id: string; expires_at: string } | null = null
      const finalSubscription = subscriptionType
      if (role === 'student' && subscriptionType === 'premium') {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-premium`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
            body: JSON.stringify({ code: paymentCoupon }),
          }
        )
        const cpnResult = await res.json()
        if (!res.ok || !cpnResult.valid) {
          setMsg({ text: cpnResult.error || 'كود القسيمة غير صحيح', type: 'error' })
          setLoading(false)
          return
        }
        couponData = { coupon_id: cpnResult.coupon_id, expires_at: cpnResult.expires_at }
      }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, role } }
      })
      if (authErr) throw authErr
      if (!authData.user) throw new Error('فشل إنشاء الحساب')

      // حساب تاريخ الانتهاء إذا كان بريميوم
      const expiryDate = couponData ? couponData.expires_at : null

      const { error: profileErr } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email,
        username,
        role,
        status: 'pending',
        full_name: username,
        specialization: role === 'instructor' ? specialization : null,
        title: role === 'instructor' ? title : null,
        hire_date: role === 'instructor' ? hireDate : null,
        whatsapp: whatsapp || null,
        study_year: role === 'student' ? studyYear : null,
        subscription_type: role === 'student' ? finalSubscription : 'free',
        payment_coupon: couponData ? paymentCoupon.trim().toUpperCase() : null,
        subscription_expires_at: expiryDate,
      })
      if (profileErr) throw profileErr

      // تسجيل استخدام الكوبون
      // استهلاك الكوبون atomically بعد إنشاء الحساب (Postgres transaction)
      if (couponData) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-coupon`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              user_id:     authData.user.id,
              coupon_code: paymentCoupon.trim(),
            }),
          }
        )
      }

      setMsg({ text: 'تم التسجيل بنجاح! حسابك قيد المراجعة حالياً.', type: 'success' })
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      setMsg({ text: err.message || 'حدث خطأ غير متوقع أثناء التسجيل', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-10" dir="rtl">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h2>
          <p className="text-blue-100 text-sm">انضم إلينا وابدأ رحلتك الآن</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Role Selection */}
            <div className="flex gap-4 mb-6">
              <label className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'student' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-blue-200'}`}>
                <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="hidden" />
                <GraduationCap className={`w-8 h-8 mb-2 ${role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-bold">حساب طالب</span>
              </label>
              <label className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'instructor' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-indigo-200'}`}>
                <input type="radio" name="role" value="instructor" checked={role === 'instructor'} onChange={() => setRole('instructor')} className="hidden" />
                <Briefcase className={`w-8 h-8 mb-2 ${role === 'instructor' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className="font-bold">حساب مدرس</span>
              </label>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="الاسم الكامل" required className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-gray-50 focus:bg-white transition-all" />
              </div>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="رقم الواتساب" className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-gray-50 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" required dir="ltr" className="w-full pr-10 pl-4 py-3 text-left rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>

            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور (8 أحرف + حروف + أرقام)" required minLength={8} dir="ltr" className="w-full pr-10 pl-4 py-3 text-left rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>

            {/* Dynamic Fields: Instructor */}
            {role === 'instructor' && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-indigo-800 font-bold flex items-center gap-2 mb-2"><Briefcase className="w-5 h-5"/> بيانات المدرس</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="التخصص (مثال: رياضيات)" required className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none bg-white" />
                  </div>
                  <div className="relative">
                    <Star className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="المسمى الوظيفي" required className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-indigo-700 mb-1 ml-1">تاريخ التعيين</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} required className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none bg-white text-gray-700" />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Fields: Student */}
            {role === 'student' && (
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-blue-800 font-bold flex items-center gap-2 mb-2"><GraduationCap className="w-5 h-5"/> بيانات الطالب</h3>
                
                <div className="relative">
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input type="text" value={studyYear} onChange={(e) => setStudyYear(e.target.value)} placeholder="سنة الدراسة (مثال: أولى ثانوي)" required className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${subscriptionType === 'free' ? 'bg-white border-blue-500 shadow-sm' : 'bg-transparent border-blue-200 hover:bg-white'}`}>
                    <input type="radio" checked={subscriptionType === 'free'} onChange={() => setSubscriptionType('free')} className="hidden" />
                    <span className="font-bold text-gray-700">حساب مجاني</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${subscriptionType === 'premium' ? 'bg-amber-50 border-amber-500 shadow-sm text-amber-700' : 'bg-transparent border-blue-200 hover:bg-white'}`}>
                    <input type="radio" checked={subscriptionType === 'premium'} onChange={() => setSubscriptionType('premium')} className="hidden" />
                    <Star className={`w-4 h-4 ${subscriptionType === 'premium' ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                    <span className="font-bold">بريميوم</span>
                  </label>
                </div>

                {subscriptionType === 'premium' && (
                  <div className="relative animate-in fade-in zoom-in-95">
                    <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                    <input type="text" value={paymentCoupon} onChange={(e) => setPaymentCoupon(e.target.value)} placeholder="أدخل كود قسيمة الدفع هنا" required className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-amber-300 focus:border-amber-500 outline-none bg-amber-50/50 placeholder-amber-700/50 font-bold" />
                  </div>
                )}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">تذكر بيانات الدخول</label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء حساب جديد'
              )}
            </button>
          </form>

          {/* Messages */}
          {msg.text && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />}
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <button onClick={() => navigate('/login')} className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                سجل الدخول من هنا
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}