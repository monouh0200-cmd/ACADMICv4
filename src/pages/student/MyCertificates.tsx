import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Award, ArrowRight, Loader2, ExternalLink, Copy, Check } from 'lucide-react'

export default function MyCertificates() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const { data } = await supabase
        .from('certificates')
        .select('*, courses(title)')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false })
      if (data) setCerts(data)
      setLoading(false)
    }
    load()
  }, [user])

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>شهاداتي</h1>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>جميع شهاداتك الموثقة رقمياً</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>
        ) : certs.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--border-color)' }}>
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
            <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>لا توجد شهادات بعد</h2>
            <p className="text-sm font-bold mb-6" style={{ color: 'var(--text-secondary)' }}>أكمل دورة كاملة للحصول على شهادتك الموثقة</p>
            <button onClick={() => navigate('/student/courses')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all">
              تصفح الدورات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map(cert => (
              <div key={cert.id}
                className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-sm leading-tight truncate">
                      {cert.courses?.title || 'دورة تدريبية'}
                    </div>
                    <div className="text-amber-100 text-xs font-bold mt-1">شهادة إتمام دورة</div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>تاريخ الإصدار</span>
                    <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                      {new Date(cert.issued_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg-app)' }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>UUID:</span>
                    <span className="text-[10px] font-mono font-bold flex-1 truncate" style={{ color: 'var(--text-primary)' }} dir="ltr">
                      {cert.id}
                    </span>
                    <button onClick={() => handleCopy(cert.id)}
                      className="shrink-0 p-1 rounded transition-colors hover:bg-emerald-50"
                      style={{ color: 'var(--text-muted)' }}>
                      {copied === cert.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button onClick={() => navigate(`/student/certificate/${cert.course_id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm transition-all">
                    <ExternalLink className="w-4 h-4" /> عرض الشهادة وطباعتها
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
