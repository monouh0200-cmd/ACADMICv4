import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  Ticket, Trash2, Ban, ShieldAlert, Loader2,
  CheckCircle, PlusCircle, ArrowRight,
  Calendar, Users, Hash, ToggleLeft, ToggleRight
} from 'lucide-react'

export default function PremiumManager() {
  const navigate = useNavigate()
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [showForm, setShowForm] = useState(false)

  // حقول إنشاء كوبون جديد
  const [newCode, setNewCode] = useState('')
  const [newDuration, setNewDuration] = useState(30)
  const [newMaxUses, setNewMaxUses] = useState<number | ''>('')
  const [newExpiry, setNewExpiry] = useState('')
  const [creating, setCreating] = useState(false)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 4000)
  }

  const loadCoupons = async () => {
    setLoading(true)
    // ✅ الجلب من جدول coupons الحقيقي
    const { data, error } = await supabase
      .from('coupons')
      .select('*, coupon_redemptions(count)')
      .order('created_at', { ascending: false })

    if (data) setCoupons(data)
    if (error) console.error(error)
    setLoading(false)
  }

  useEffect(() => { loadCoupons() }, [])

  // ✅ إنشاء كوبون جديد في جدول coupons
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return
    setCreating(true)
    try {
      const { error } = await supabase.from('coupons').insert({
        code: newCode.trim().toUpperCase(),
        duration_days: newDuration,
        max_uses: newMaxUses === '' ? null : newMaxUses,
        expires_at: newExpiry || null,
        is_active: true,
        used_count: 0 })
      if (error) {
        if (error.code === '23505') showMsg('هذا الكود موجود بالفعل.', 'error')
        else throw error
      } else {
        showMsg('✅ تم إنشاء الكوبون بنجاح.', 'success')
        setNewCode(''); setNewDuration(30); setNewMaxUses(''); setNewExpiry('')
        setShowForm(false)
        loadCoupons()
      }
    } catch (err: any) {
      showMsg('فشل إنشاء الكوبون: ' + err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  // تفعيل/تعطيل كوبون
  const handleToggleCoupon = async (id: string, currentState: boolean) => {
    setActionLoading(id)
    const { error } = await supabase.from('coupons').update({ is_active: !currentState }).eq('id', id)
    if (error) showMsg('فشل تغيير حالة الكوبون', 'error')
    else { showMsg(`✅ تم ${!currentState ? 'تفعيل' : 'تعطيل'} الكوبون.`, 'success'); loadCoupons() }
    setActionLoading(null)
  }

  // إيقاف الكوبون وإلغاء ترقية مستخدميه
  const handleStopCoupon = async (couponCode: string, couponId: string) => {
    if (!confirm(`⚠️ سيتم تعطيل الكوبون وتحويل جميع مستخدميه لـ Free. هل أنت متأكد؟`)) return
    setActionLoading(couponId)
    try {
      await supabase.from('profiles')
        .update({ subscription_type: 'free', payment_coupon: null, subscription_expires_at: null })
        .eq('payment_coupon', couponCode)
      await supabase.from('coupons').update({ is_active: false }).eq('id', couponId)
      showMsg('✅ تم إيقاف الكوبون وإلغاء ترقية مستخدميه.', 'success')
      loadCoupons()
    } catch (err: any) {
      showMsg('فشل الإيقاف: ' + err.message, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الكوبون نهائياً؟')) return
    setActionLoading(id)
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) showMsg('فشل الحذف: ' + error.message, 'error')
    else { showMsg('✅ تم حذف الكوبون.', 'success'); loadCoupons() }
    setActionLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">

        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500">
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">إدارة كوبونات الترقية</h1>
              <p className="text-slate-500 font-medium">إنشاء وإدارة كوبونات Premium المحمية</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">
            <PlusCircle className="w-5 h-5" />
            كوبون جديد
          </button>
        </header>

        {msg.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 font-bold ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            {msg.text}
          </div>
        )}

        {/* ✅ فورم إنشاء كوبون جديد */}
        {showForm && (
          <div className="bg-white rounded-3xl border border-amber-100 shadow-xl p-8">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-amber-500" /> إنشاء كوبون جديد
            </h2>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <label className="block text-sm font-black text-slate-600 mb-2">كود الكوبون *</label>
                <input type="text" required placeholder="مثال: VIP-2026-ABC"
                  value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 outline-none font-black tracking-widest uppercase" dir="ltr" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> مدة الاشتراك (أيام) *
                </label>
                <input type="number" min={1} required value={newDuration}
                  onChange={e => setNewDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 outline-none font-black" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4" /> الحد الأقصى للاستخدامات (فارغ = بلا حد)
                </label>
                <input type="number" min={1} placeholder="غير محدود"
                  value={newMaxUses} onChange={e => setNewMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 outline-none font-black" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 flex items-center gap-1">
                  <Hash className="w-4 h-4" /> تاريخ انتهاء الكوبون (اختياري)
                </label>
                <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 outline-none font-black" />
              </div>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                  إنشاء الكوبون
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* جدول الكوبونات */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-black text-sm">
                <tr>
                  <th className="p-5">الكود</th>
                  <th className="p-5">المدة</th>
                  <th className="p-5">الاستخدامات</th>
                  <th className="p-5">الانتهاء</th>
                  <th className="p-5">الحالة</th>
                  <th className="p-5">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> جاري التحميل...
                  </td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                    لا توجد كوبونات بعد. أنشئ أول كوبون الآن!
                  </td></tr>
                ) : coupons.map((coupon) => {
                  const usedCount = coupon.used_count || 0
                  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
                  const isFull = coupon.max_uses !== null && usedCount >= coupon.max_uses
                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-black text-slate-800 tracking-widest font-mono" dir="ltr">
                        {coupon.code}
                      </td>
                      <td className="p-5 font-bold text-slate-600">
                        {coupon.duration_days} يوم
                      </td>
                      <td className="p-5 font-bold text-slate-600">
                        {usedCount} / {coupon.max_uses ?? '∞'}
                      </td>
                      <td className="p-5 font-bold text-slate-600">
                        {coupon.expires_at
                          ? <span className={isExpired ? 'text-red-500' : ''}>
                              {new Date(coupon.expires_at).toLocaleDateString('ar-EG')}
                            </span>
                          : <span className="text-slate-400">بلا حد</span>
                        }
                      </td>
                      <td className="p-5">
                        {coupon.is_active && !isExpired && !isFull
                          ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">نشط ✓</span>
                          : <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black">
                              {!coupon.is_active ? 'معطل' : isExpired ? 'منتهي' : 'مستنفد'}
                            </span>
                        }
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => handleToggleCoupon(coupon.id, coupon.is_active)}
                            disabled={actionLoading === coupon.id}
                            title={coupon.is_active ? 'تعطيل' : 'تفعيل'}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">
                            {coupon.is_active
                              ? <ToggleRight className="w-5 h-5" />
                              : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                          </button>
                          <button onClick={() => handleStopCoupon(coupon.code, coupon.id)}
                            disabled={actionLoading === coupon.id}
                            title="إيقاف وإلغاء ترقية المستخدمين"
                            className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-all">
                            <Ban className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(coupon.id)}
                            disabled={actionLoading === coupon.id}
                            title="حذف نهائي"
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all">
                            {actionLoading === coupon.id
                              ? <Loader2 className="w-5 h-5 animate-spin" />
                              : <Trash2 className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
