import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { BookOpen, GraduationCap, Target, Sparkles, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'

const STEPS = [
  { icon: Sparkles, title: 'مرحباً بك في الأكاديمية! 🎉', desc: 'نحن سعداء بانضمامك. خليك تتعرف على المنصة في 3 خطوات سريعة.', color: 'from-blue-600 to-indigo-600' },
  { icon: BookOpen,   title: 'اكتشف الدورات',    desc: 'لدينا دورات في تخصصات متعددة — من دورات مجانية للمبتدئين وصولاً لمحتوى متقدم حصري.', color: 'from-indigo-600 to-purple-600' },
  { icon: GraduationCap, title: 'تعلم واحصل على شهادتك', desc: 'أكمل الدروس، اجتز الاختبارات، واحصل على شهادة موثقة رقمياً بـ UUID فريد.', color: 'from-purple-600 to-pink-600' },
  { icon: Target, title: 'ما هو هدفك؟', desc: 'أخبرنا ما الذي تريد تعلمه.', color: 'from-emerald-600 to-teal-600', isGoal: true },
]
const GOALS = [
  { id: 'career', label: 'تطوير مسيرتي المهنية', emoji: '💼' },
  { id: 'skill',  label: 'تعلم مهارة جديدة',     emoji: '🚀' },
  { id: 'cert',   label: 'الحصول على شهادة',      emoji: '🏆' },
  { id: 'hobby',  label: 'تعلم هواية',             emoji: '🎯' },
]

export default function Onboarding() {
  const { user, profile, checkSession } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // If already done onboarding, skip to courses
    if (profile?.onboarding_done) {
      navigate('/student/courses', { replace: true })
    } else {
      setChecking(false)
    }
  }, [profile])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  )

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const Icon = current.icon

  const handleFinish = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      onboarding_goal: goal || null,
      onboarding_done: true
    }).eq('id', user!.id)
    await checkSession()
    navigate('/student/courses')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="max-w-sm w-full">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-emerald-600' : i < step ? 'w-2 bg-emerald-300' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)', border: '1px solid' }}>
          <div className={`bg-gradient-to-br ${current.color} p-8 text-center`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-black text-white mb-2">{current.title}</h1>
            <p className="text-white/80 font-medium text-sm leading-relaxed">{current.desc}</p>
          </div>

          <div className="p-6">
            {(current as any).isGoal && (
              <div className="grid grid-cols-2 gap-2 mb-5">
                {GOALS.map(opt => (
                  <button key={opt.id} onClick={() => setGoal(opt.id)}
                    className={`p-3 rounded-xl border-2 font-bold text-xs text-right transition-all ${goal === opt.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                    <span className="text-xl block mb-1">{opt.emoji}</span>
                    {opt.label}
                    {goal === opt.id && <Check className="w-3 h-3 text-emerald-600 float-left" />}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all">
                  <ChevronRight className="w-4 h-4" /> السابق
                </button>
              )}
              <button
                onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all text-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLast ? 'ابدأ التعلم ✨' : (<>التالي <ChevronLeft className="w-4 h-4" /></>)}
              </button>
            </div>

            {isLast && (
              <button onClick={() => navigate('/student/courses')}
                className="w-full text-center text-xs text-slate-400 font-bold mt-2 hover:text-slate-600 transition-colors py-1">
                تخطي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
