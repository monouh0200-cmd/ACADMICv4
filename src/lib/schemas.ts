import { z } from 'zod'

// ── مساعدات مشتركة ────────────────────────────────────────────────────────
const emailField = z
  .string({ required_error: 'البريد الإلكتروني مطلوب' })
  .email('البريد الإلكتروني غير صحيح')
  .toLowerCase()
  .trim()

const passwordField = z
  .string({ required_error: 'كلمة المرور مطلوبة' })
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Za-z]/, 'كلمة المرور يجب أن تحتوي على حروف إنجليزية')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على أرقام')

const whatsappField = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^\+?[0-9\s\-]{7,15}$/.test(v),
    'رقم الواتساب غير صحيح'
  )

// ── Login ─────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})
export type LoginInput = z.infer<typeof loginSchema>

// ── Register — Student ───────────────────────────────────────────────────
export const registerStudentSchema = z.object({
  role:              z.literal('student'),
  username:          z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').trim(),
  email:             emailField,
  password:          passwordField,
  whatsapp:          whatsappField,
  study_year:        z.string().min(2, 'سنة الدراسة مطلوبة').trim(),
  subscription_type: z.enum(['free', 'premium']),
  payment_coupon:    z.string().optional(),
}).refine(
  (d) => !(d.subscription_type === 'premium' && !d.payment_coupon?.trim()),
  { message: 'قسيمة الدفع مطلوبة للاشتراك البريميوم', path: ['payment_coupon'] }
)
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>

// ── Register — Instructor ────────────────────────────────────────────────
export const registerInstructorSchema = z.object({
  role:           z.literal('instructor'),
  username:       z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').trim(),
  email:          emailField,
  password:       passwordField,
  whatsapp:       whatsappField,
  specialization: z.string().min(2, 'التخصص مطلوب').trim(),
  title:          z.string().min(2, 'المسمى الوظيفي مطلوب').trim(),
  hire_date:      z.string().min(1, 'تاريخ التعيين مطلوب'),
})
export type RegisterInstructorInput = z.infer<typeof registerInstructorSchema>

// ✅ z.union بدل z.discriminatedUnion — أكثر توافقاً مع كل إصدارات Zod
export const registerSchema = z.union([
  registerStudentSchema,
  registerInstructorSchema,
])
export type RegisterInput = z.infer<typeof registerSchema>

// ── Coupon Redeem ────────────────────────────────────────────────────────
export const redeemCouponSchema = z.object({
  code: z
    .string({ required_error: 'كود القسيمة مطلوب' })
    .min(3, 'كود القسيمة قصير جداً')
    .max(50, 'كود القسيمة طويل جداً')
    .trim()
    .toUpperCase(),
})
export type RedeemCouponInput = z.infer<typeof redeemCouponSchema>

// ── Profile Update ───────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  username: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').trim().optional(),
  whatsapp: whatsappField,
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ── Course Form ──────────────────────────────────────────────────────────
export const courseSchema = z.object({
  title:       z.string().min(5, 'عنوان الكورس يجب أن يكون 5 أحرف على الأقل').trim(),
  description: z.string().min(20, 'الوصف يجب أن يكون 20 حرف على الأقل').trim(),
  is_premium:  z.boolean().default(false),
})
export type CourseInput = z.infer<typeof courseSchema>

// ── Lesson Form ──────────────────────────────────────────────────────────
export const lessonSchema = z.object({
  title:      z.string().min(3, 'عنوان الدرس مطلوب').trim(),
  content:    z.string().optional(),
  video_url:  z.string().url('رابط الفيديو غير صحيح').optional().or(z.literal('')),
  order_index: z.number().int().min(1).default(1),
  is_premium: z.boolean().default(false),
})
export type LessonInput = z.infer<typeof lessonSchema>

// ── مساعد: استخراج أول رسالة خطأ ────────────────────────────────────────
export function getZodError(error: z.ZodError): string {
  return error.errors[0]?.message ?? 'خطأ في البيانات المدخلة'
}