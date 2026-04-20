import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ── Types ──────────────────────────────────────────────
export type Role = 'student' | 'instructor' | 'super_admin'
export type Status = 'pending' | 'approved' | 'rejected'
export type SubscriptionType = 'free' | 'premium'

export interface Profile {
  id: string
  email: string
  username: string
  full_name?: string
  role: Role
  status: Status
  whatsapp?: string
  study_year?: string
  subscription_type: SubscriptionType
  subscription_expires_at?: string | null
  payment_coupon?: string
  specialization?: string
  title?: string
  hire_date?: string
  onboarding_done: boolean
  onboarding_goal?: string
  created_at: string
  updated_at: string
  [key: string]: any
}

type AuthUser = {
  id: string
  email?: string
  [key: string]: any
}

interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
  clearStore: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  refreshProfile: () => Promise<Profile | null>
}

// ── Store ──────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,

  clearStore: () => set({ user: null, profile: null, error: null, isLoading: false }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await supabase.auth.signOut()
      
      // ✅ تصحيح 1: data: authData
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (authErr) {
        console.error('❌ Auth error:', authErr.message)
        throw new Error(authErr.message.includes('Invalid login credentials') 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
          : authErr.message)
      }

      if (!authData?.user) {
        throw new Error('فشل في إنشاء جلسة المستخدم')
      }

      // ✅ تصحيح 2: data: profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileErr || !profile) {
        console.error('❌ Profile fetch error:', profileErr?.message || 'Profile not found')
        await supabase.auth.signOut()
        set({ isLoading: false })
        return { success: false, message: '❌ لم يتم العثور على بيانات الحساب' }
      }

      if (profile.status === 'pending') {
        await supabase.auth.signOut()
        set({ isLoading: false })
        return { success: false, message: '⏳ حسابك قيد المراجعة من قبل المشرف' }
      }

      if (profile.status === 'rejected') {
        await supabase.auth.signOut()
        set({ isLoading: false })
        return { success: false, message: '❌ تم رفض حسابك، يرجى التواصل مع الدعم' }
      }

      set({ 
        user: authData.user, 
        profile, 
        isLoading: false,
        error: null 
      })
      
      return { success: true, message: '✅ تم تسجيل الدخول بنجاح' }

    } catch (err: any) {
      console.error('💥 Login exception:', err)
      set({ 
        isLoading: false, 
        error: err.message || 'حدث خطأ غير متوقع' 
      })
      return { success: false, message: err.message || '❌ فشل تسجيل الدخول' }
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('⚠️ SignOut error (ignored):', err)
    } finally {
      set({ user: null, profile: null, error: null, isLoading: false })
    }
  },

  checkSession: async () => {
    set({ isLoading: true })
    
    try {
      // ✅ تصحيح 3: data: { session }
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
      
      if (sessionErr || !session?.user) {
        set({ user: null, profile: null, isLoading: false })
        return
      }

      // ✅ تصحيح 4: data: profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileErr || !profile) {
        console.warn('⚠️ Profile not found for session, signing out...')
        await supabase.auth.signOut()
        set({ user: null, profile: null, isLoading: false })
        return
      }

      // 🔐 منطق انتهاء الاشتراك: تحديث محلي فقط (بدون محاولة تحديث الداتابيز)
      let currentProfile = profile
      if (profile.subscription_type === 'premium' && profile.subscription_expires_at) {
        const expiryDate = new Date(profile.subscription_expires_at)
        const now = new Date()
        
        if (expiryDate < now) {
          console.log('🔄 Subscription expired, downgrading to free...')
          
          // ✅ تحديث محلي فقط — الـ trigger يتولى تحديث الداتابيز عند الحاجة
          currentProfile = { 
            ...profile, 
            subscription_type: 'free' as SubscriptionType,
            payment_coupon: null,
            subscription_expires_at: null
          }
        }
      }

      set({ 
        user: session.user, 
        profile: currentProfile, 
        isLoading: false,
        error: null 
      })

    } catch (e: any) {
      console.error('❌ Session check failed:', e)
      set({ user: null, profile: null, isLoading: false, error: e?.message || 'Session error' })
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user?.id) return null

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) throw error

      set({ profile })
      return profile
    } catch (err) {
      console.error('❌ Failed to refresh profile:', err)
      return null
    }
  }
}))