import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronLeft, Star, Play, Shield, Zap, Globe } from 'lucide-react'

const FEATURES = [
  { icon: BookOpen, title: 'محتوى متخصص', desc: 'دورات مصممة بعناية من قبل خبراء متخصصين في مجالاتهم.', color: 'bg-blue-50 text-blue-600' },
  { icon: Shield, title: 'شهادات موثقة', desc: 'شهادات إتمام رقمية قابلة للتحقق بمعرف فريد لكل شهادة.', color: 'bg-green-50 text-green-600' },
  { icon: Zap, title: 'تعلم بالسرعة التي تناسبك', desc: 'دروس مسجلة تستطيع مشاهدتها في أي وقت ومن أي مكان.', color: 'bg-amber-50 text-amber-600' },
  { icon: Globe, title: 'مجتمع تعليمي', desc: 'تفاعل مع الزملاء والمدرسين عبر نظام التعليقات التفاعلي.', color: 'bg-purple-50 text-purple-600' },
]

const STATS = [
  { label: 'دورة تدريبية', value: '50+' },
  { label: 'طالب مسجل', value: '2,000+' },
  { label: 'مدرس متخصص', value: '20+' },
  { label: 'شهادة صادرة', value: '800+' },
]

const TESTIMONIALS = [
  { name: 'أحمد محمد', role: 'مهندس زراعي', text: 'المنصة غيّرت طريقة تعلمي تماماً. المحتوى منظم واحترافي والمدرسون متجاوبون.', rating: 5 },
  { name: 'سارة علي', role: 'طالبة دراسات عليا', text: 'الشهادات موثوقة ومعترف بها. استطعت إضافتها لـ CV وأثّرت بشكل إيجابي في مساري المهني.', rating: 5 },
  { name: 'محمد إبراهيم', role: 'متخصص جودة', text: 'أفضل استثمار قمت به لتطوير مهاراتي. المحتوى عملي ومباشر وقابل للتطبيق.', rating: 5 },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-800">الأكاديمية</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-slate-700 font-bold hover:text-blue-600 transition-colors">
              تسجيل الدخول
            </button>
            <button onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5">
              ابدأ مجاناً
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 py-24 px-6">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-20 translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            منصة التعليم الأكثر ثقة في المنطقة
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            طوّر مهاراتك مع
            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-indigo-300 mt-2">
              أفضل المدرسين المتخصصين
            </span>
          </h1>

          <p className="text-xl text-slate-300 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            منصة تعليمية متكاملة تجمع أفضل الدورات التدريبية مع شهادات معتمدة وموثقة رقمياً.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/30 transition-all hover:-translate-y-1 text-lg">
              ابدأ التعلم مجاناً
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all text-lg backdrop-blur-sm">
              <Play className="w-5 h-5" />
              لدي حساب بالفعل
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-blue-200 font-bold text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">لماذا الأكاديمية؟</h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">كل ما تحتاجه لرحلة تعليمية ناجحة في مكان واحد</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-5`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">ماذا يقول طلابنا</h2>
            <p className="text-slate-500 font-medium text-lg">تجارب حقيقية من طلاب أكملوا دوراتهم</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-slate-800 text-sm">{t.name}</div>
                    <div className="text-slate-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">مستعد تبدأ رحلتك التعليمية؟</h2>
          <p className="text-blue-100 text-lg font-medium mb-10">سجل الآن مجاناً وابدأ أول دورة خلال دقائق</p>
          <button onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-blue-700 font-black rounded-2xl shadow-2xl hover:-translate-y-1 transition-all text-lg">
            سجل الآن مجاناً ←
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-black">الأكاديمية</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} الأكاديمية — جميع الحقوق محفوظة</p>
      </footer>

    </div>
  )
}
