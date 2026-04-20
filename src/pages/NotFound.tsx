import { useNavigate } from 'react-router-dom'
import { Home, ArrowRight, Search } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-black leading-none mb-4 select-none"
          style={{ color: 'var(--border-color)' }}>404</div>
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-5">
          <Search className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>الصفحة غير موجودة</h1>
        <p className="mb-8 text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          الرابط الذي تبحث عنه غير موجود أو تم نقله. تحقق من الرابط أو عد للصفحة الرئيسية.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all">
            <Home className="w-4 h-4" /> لوحة التحكم
          </button>
          <button onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl border transition-all"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            <ArrowRight className="w-4 h-4" /> رجوع
          </button>
        </div>
      </div>
    </div>
  )
}
