import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { 
  User, Phone, Lock, Save, 
  Loader2, CheckCircle2, AlertCircle, 
  ArrowRight, GraduationCap, ShieldCheck 
} from 'lucide-react'

export default function Settings() {
  const { user, profile, checkSession } = useAuthStore()
  const navigate = useNavigate()

  // حالات الحقول
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '')
  const [studyYear, setStudyYear] = useState(profile?.study_year || '')
  
  // حالات كلمة المرور
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  // تحديث البيانات الأساسية
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg({ text: '', type: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          whatsapp: whatsapp,
          study_year: studyYear
        })
        .eq('id', user?.id)

      if (error) throw error

      await checkSession() // تحديث البيانات في المتجر
      setMsg({ text: '✅ تم تحديث بيانات الملف الشخصي بنجاح', type: 'success' })
    } catch (err: any) {
      setMsg({ text: '❌ فشل التحديث: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // تحديث كلمة المرور
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMsg({ text: '❌ كلمات المرور غير متطابقة', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setMsg({ text: '✅ تم تغيير كلمة المرور بنجاح', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMsg({ text: '❌ خطأ: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-blue-600">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">إعدادات الحساب</h1>
              <p className="text-slate-500 font-medium">تحكم في بياناتك الشخصية وخصوصية حسابك</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all"
          >
            <ArrowRight className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {msg.text && (
          <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-bold">{msg.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-600"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-white p-1 mx-auto mb-4 shadow-xl">
                  <div className="w-full h-full rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-slate-800">{profile?.username}</h2>
                <p className="text-sm text-slate-400 font-bold mb-4">{profile?.email}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100">
                   <ShieldCheck className="w-3 h-3" /> طالب معتمد
                </div>
              </div>
            </div>

            <div className="bg-indigo-900 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="font-black mb-2 flex items-center gap-2 text-indigo-200">
                   <ShieldCheck className="w-5 h-5" /> حماية الحساب
                 </h4>
                 <p className="text-xs leading-relaxed opacity-80">تأكد دائماً من استخدام كلمة مرور قوية وتحديث بيانات تواصلك لتتمكن من استعادة حسابك في أي وقت.</p>
               </div>
               <Lock className="absolute -bottom-4 -left-4 w-24 h-24 text-white/10 -rotate-12" />
            </div>
          </div>

          {/* Main Forms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Profile Form */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" /> البيانات الشخصية
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 mr-2">الاسم الكامل</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 mr-2">اسم المستخدم</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 mr-2">رقم الواتساب</label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={whatsapp} 
                        onChange={(e) => setWhatsapp(e.target.value)} 
                        className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 mr-2">السنة الدراسية</label>
                    <div className="relative">
                      <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={studyYear} 
                        onChange={(e) => setStudyYear(e.target.value)} 
                        className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  حفظ التغييرات
                </button>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                <Lock className="w-6 h-6 text-red-500" /> تغيير كلمة المرور
              </h3>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 mr-2">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 mr-2">تأكيد كلمة المرور</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !newPassword}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  تحديث كلمة المرور
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}