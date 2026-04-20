import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function InstructorProfile() {
  const { user, profile, checkSession } = useAuthStore()
  const [username, setUsername] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setSpecialization(profile.specialization || '')
      setWhatsapp((profile as any).whatsapp || '')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), specialization: specialization.trim(), whatsapp: whatsapp.trim() || null })
        .eq('id', user.id)
      if (error) throw error
      setMsg('✅ تم حفظ البيانات بنجاح')
      await checkSession()
    } catch (err: any) {
      setMsg('❌ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/dashboard')} style={backBtnStyle}>← لوحة التحكم</button>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>⚙️ إعدادات الحساب</h2>

      {/* بطاقة معلومات الحساب */}
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
          📧 <strong>البريد الإلكتروني:</strong> {user?.email}
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
          👤 <strong>الدور:</strong> {profile?.role === 'super_admin' ? 'مشرف عام' : profile?.role === 'instructor' ? 'مدرس' : 'طالب'}
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
          ✅ <strong>حالة الحساب:</strong>{' '}
          <span style={{ color: profile?.status === 'approved' ? '#16a34a' : '#f59e0b' }}>
            {profile?.status === 'approved' ? 'مفعّل' : 'قيد المراجعة'}
          </span>
        </p>
      </div>

      {/* فورم التعديل */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div>
          <label style={labelStyle}>اسم المستخدم</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>التخصص</label>
          <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="مثال: رياضيات، فيزياء، برمجة..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>رقم الواتساب</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="مثال: 201012345678+" style={inputStyle} dir="ltr" />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '12px', backgroundColor: saving ? '#9ca3af' : '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>

      {msg && (
        <p style={{ marginTop: '15px', textAlign: 'center', padding: '10px', background: msg.includes('✅') ? '#dcfce7' : '#fee2e2', color: msg.includes('✅') ? '#166534' : '#991b1b', borderRadius: '6px', fontWeight: 'bold' }}>
          {msg}
        </p>
      )}
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  marginBottom: '15px', padding: '8px 15px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer',
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', direction: 'rtl',
}