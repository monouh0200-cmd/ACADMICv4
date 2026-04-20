import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { Award, Printer, ArrowRight, Loader2, CheckCircle, ShieldCheck, Copy, Check } from 'lucide-react'

export default function Certificate() {
  const { courseId } = useParams()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEligible, setIsEligible] = useState(false)
  const [certData, setCertData] = useState<any>(null) // بيانات الشهادة المحفوظة
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const verifyAndIssueCertificate = async () => {
      if (!courseId || !user) { setLoading(false); return }
      try {
        // 1. جلب بيانات الدورة
        const { data: cData } = await api.courses.get(courseId)
        if (cData) setCourse(cData)

        // 2. طلب إصدار الشهادة عبر Edge Function
        //    الـ server يتحقق من التسجيل + اكتمال الدروس قبل الإصدار
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/issue-certificate`,
          {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'apikey':         import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ course_id: courseId }),
          }
        )
        const result = await res.json()

        if (!res.ok) {
          // غير مؤهل — رسالة الخطأ من الـ server
          setIsEligible(false)
          setLoading(false)
          return
        }

        setIsEligible(true)
        setCertData(result.certificate)

      } catch (err) {
        console.error('خطأ في التحقق من الشهادة:', err)
      } finally {
        setLoading(false)
      }
    }
    verifyAndIssueCertificate()
  }, [courseId, user])

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

  const shortId = certData?.id ? certData.id.split('-')[0].toUpperCase() : ''

  const handleCopy = () => {
    if (certData?.id) {
      navigator.clipboard.writeText(certData.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
    </div>
  )

  if (!isEligible) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <ShieldCheck className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">الشهادة غير متاحة بعد</h2>
      <p className="text-slate-500 mb-8 max-w-md">يجب إكمال جميع دروس الدورة بنسبة 100%.</p>
      <button onClick={() => navigate(`/student/course/${courseId}`)}
        className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">العودة للدورة</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4" dir="rtl">

      {/* أدوات التحكم */}
      <div className="max-w-5xl w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <button onClick={() => navigate(`/student/course/${courseId}`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 hover:text-indigo-600 rounded-xl font-bold shadow-sm transition-colors border border-slate-200">
          <ArrowRight className="w-5 h-5" /> العودة للدورة
        </button>

        <div className="flex items-center gap-3">
          {/* ✅ عرض UUID مختصر مع إمكانية النسخ */}
          {certData?.id && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
              <span className="text-xs text-slate-400 font-bold">رقم الشهادة:</span>
              <span className="text-xs font-black text-indigo-700 tracking-wider" dir="ltr">{shortId}</span>
              <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-600 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg transition-all active:scale-95">
            <Printer className="w-5 h-5" /> طباعة / PDF
          </button>
        </div>
      </div>

      {/* ✅ معلومات التحقق */}
      {certData?.id && (
        <div className="max-w-5xl w-full mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 print:hidden">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
          <div className="text-sm">
            <span className="font-black text-green-800">شهادة موثقة ✓ </span>
            <span className="text-green-700">رقم التحقق الكامل: </span>
            <span className="font-mono text-xs text-green-900 font-bold" dir="ltr">{certData.id}</span>
          </div>
        </div>
      )}

      {/* تصميم الشهادة */}
      <div className="w-full max-w-[1123px] aspect-[1.414/1] bg-white shadow-2xl relative overflow-hidden print:shadow-none print:m-0 border-[16px] border-slate-900 p-2">
        <div className="w-full h-full border-4 border-amber-500/50 p-8 md:p-16 flex flex-col items-center text-center relative">

          {/* زخارف الزوايا */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-500"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-500"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-500"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-500"></div>

          <div className="w-24 h-24 bg-slate-900 text-amber-500 rounded-full flex items-center justify-center mb-8 shadow-xl">
            <Award className="w-12 h-12" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-widest">شهادة إتمام دورة</h1>
          <p className="text-lg text-amber-600 font-bold mb-12 uppercase tracking-widest">Certificate of Completion</p>

          <p className="text-xl text-slate-600 font-medium mb-4">يُشهد بأن المتدرب / المتدربة:</p>
          <h2 className="text-3xl md:text-5xl font-black text-indigo-900 mb-8 border-b-2 border-slate-200 pb-4 px-12 inline-block">
            {profile?.full_name || profile?.username || 'اسم الطالب'}
          </h2>

          <p className="text-xl text-slate-600 font-medium mb-4">قد اجتاز بنجاح الدورة التدريبية بعنوان:</p>
          <h3 className="text-2xl md:text-4xl font-black text-slate-800 mb-10 leading-relaxed">
            "{course?.title}"
          </h3>

          {/* التوقيعات والتاريخ */}
          <div className="w-full flex justify-between items-end mt-auto px-10 md:px-20">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800 mb-2 border-b-2 border-slate-800 pb-2 px-8 inline-block italic">إدارة المنصة</div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">توقيع المدرس</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 border-4 border-amber-500 rounded-full flex items-center justify-center text-amber-500 rotate-12 mb-2 opacity-80">
                <CheckCircle className="w-10 h-10" />
              </div>
              {/* ✅ رقم التحقق يظهر على الشهادة نفسها */}
              {certData?.id && (
                <p className="text-[9px] font-mono text-slate-400 mt-1" dir="ltr">{certData.id}</p>
              )}
            </div>

            <div className="text-center">
              <div className="text-lg font-black text-slate-800 mb-2 border-b-2 border-slate-800 pb-2 px-8 inline-block">
                {certData?.issued_at ? formatDate(certData.issued_at) : ''}
              </div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">تاريخ الإصدار</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
