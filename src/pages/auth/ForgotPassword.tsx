import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
      })
      if (err) throw err
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">استعادة كلمة المرور</h2>
          <p className="text-emerald-100 text-sm">أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة</p>
        </div>

        <div className="p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">تم الإرسال!</h3>
              <p className="text-slate-500 text-sm mb-6">تحقق من بريدك الإلكتروني واضغط على رابط الاستعادة. قد يستغرق وصوله بضع دقائق.</p>
              <button onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 text-white font-bold rounded-xl">
                <ArrowRight className="w-4 h-4" /> العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني المسجل" dir="ltr"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border text-left outline-none transition-all bg-slate-50 focus:bg-white focus:border-emerald-500"
                  style={{ borderColor: 'var(--border-color)' }} />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md shadow-emerald-200 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                إرسال رابط الاستعادة
              </button>

              <button type="button" onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors">
                <ArrowRight className="w-4 h-4" /> العودة لتسجيل الدخول
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
