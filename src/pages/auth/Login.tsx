import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogIn, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { loginSchema, getZodError } from '../../lib/schemas'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading: authLoading } = useAuthStore() // ✅ إعادة تسمية لتجنب التداخل
  const navigate = useNavigate()
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [isSubmitting, setIsSubmitting] = useState(false) // ✅ حالة محلية للنموذج فقط

  // ✅ دمج حالتين: تحميل المصادقة + إرسال النموذج
  const isButtonLoading = isSubmitting || (authLoading && isSubmitting)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ text: '', type: '' })

    // ── Zod validation ─────────────────────────────────────
    const parseResult = loginSchema.safeParse({ email, password })
    if (!parseResult.success) {
      setMsg({ text: getZodError(parseResult.error), type: 'error' })
      return
    }

    setIsSubmitting(true) // ✅ تفعيل التحميل فقط بعد الضغط والتحقق
    try {
      const loginResult = await login(email, password)

      if (loginResult.success) {
        setMsg({ text: loginResult.message, type: 'success' })
        setTimeout(() => navigate('/dashboard'), 1000)
      } else {
        setMsg({ text: loginResult.message, type: 'error' })
      }
    } catch (err: any) {
      setMsg({ text: err.message || '❌ حدث خطأ غير متوقع', type: 'error' })
    } finally {
      setIsSubmitting(false) // ✅ إيقاف التحميل بعد الانتهاء
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">مرحباً بعودتك!</h2>
          <p className="text-blue-100 text-sm">سجل دخولك لمتابعة رحلتك التعليمية</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isButtonLoading} // ✅ تعطيل الحقول أثناء التحميل
                  dir="ltr"
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-left bg-gray-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isButtonLoading} // ✅ تعطيل الحقول أثناء التحميل
                  dir="ltr"
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-left bg-gray-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isButtonLoading} // ✅ استخدام الحالة المدمجة
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isButtonLoading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {isButtonLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Messages */}
          {msg.text && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />}
              <p className="text-sm font-medium">{msg.text}</p>
            </div>
          )}

          {/* Links */}
          <div className="mt-6 space-y-3">
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              disabled={isButtonLoading} // ✅ تعطيل الروابط أثناء التحميل
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              نسيت كلمة المرور؟
            </button>
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                ليس لديك حساب؟{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
                  disabled={isButtonLoading} // ✅ تعطيل الروابط أثناء التحميل
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  سجل الآن مجاناً
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}