import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Lock, Loader2, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [loading, setLoading]           = useState(false)
  const [ready, setReady]               = useState(false)   // الـ session جاهزة
  const [done, setDone]                 = useState(false)
  const [error, setError]               = useState('')

  // Supabase بيبعت recovery token في الـ URL hash:
  // /reset-password#access_token=...&type=recovery
  // supabase-js بيتعامل معاه تلقائياً عبر onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const validate = (): string | null => {
    if (password.length < 8)
      return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
      return 'يجب أن تحتوي على حروف إنجليزية وأرقام معاً'
    if (password !== confirm)
      return 'كلمتا المرور غير متطابقتين'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
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
          <h2 className="text-2xl font-black text-white mb-2">تعيين كلمة مرور جديدة</h2>
          <p className="text-emerald-100 text-sm">أدخل كلمة المرور الجديدة أدناه</p>
        </div>

        <div className="p-8">
          {/* ── نجاح ─────────────────────────────────────────── */}
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">تم التغيير بنجاح!</h3>
              <p className="text-slate-500 text-sm">جاري تحويلك لصفحة تسجيل الدخول…</p>
            </div>

          // الرابط لم يُفعَّل بعد
          ) : !ready ? (
            <div className="text-center py-6">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-slate-500 text-sm font-bold">جاري التحقق من رابط الاستعادة…</p>
              <p className="text-slate-400 text-xs mt-2">
                إذا وصلت لهذه الصفحة بشكل مباشر، يرجى استخدام رابط البريد الإلكتروني
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="mt-4 text-sm text-emerald-600 hover:underline font-bold"
              >
                طلب رابط جديد
              </button>
            </div>

          // فورم التغيير
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* كلمة المرور الجديدة */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8 أحرف + حروف إنجليزية + أرقام"
                    required minLength={8} dir="ltr"
                    className="w-full pr-10 pl-10 py-3 rounded-xl border text-left outline-none transition-all bg-slate-50 focus:bg-white focus:border-emerald-500"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    required minLength={8} dir="ltr"
                    className="w-full pr-10 pl-4 py-3 rounded-xl border text-left outline-none transition-all bg-slate-50 focus:bg-white focus:border-emerald-500"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                حفظ كلمة المرور الجديدة
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
