-- ============================================================
-- Academy v6 — COMPLETE Migration
-- Run once in Supabase SQL Editor on a fresh project
-- ============================================================

-- ── HELPER: is_admin() SECURITY DEFINER ─────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') = 'super_admin',
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  username                TEXT NOT NULL,
  full_name               TEXT,
  role                    TEXT NOT NULL DEFAULT 'student'
                          CHECK (role IN ('student','instructor','super_admin')),
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
  whatsapp                TEXT,
  -- Student fields
  study_year              TEXT,
  subscription_type       TEXT NOT NULL DEFAULT 'free' CHECK (subscription_type IN ('free','premium')),
  subscription_expires_at TIMESTAMPTZ,
  payment_coupon          TEXT,
  -- Instructor fields
  specialization          TEXT,
  title                   TEXT,
  hire_date               DATE,
  -- Onboarding
  onboarding_done         BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_goal         TEXT,
  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================================
-- 2. courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  is_premium    BOOLEAN NOT NULL DEFAULT FALSE,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  category      TEXT DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published  ON courses(is_published);

-- ============================================================
-- 3. lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  video_url   TEXT,
  file_url    TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, order_index);

-- ============================================================
-- 4. enrollments
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id)    ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enroll_user   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_course ON enrollments(course_id);

-- ============================================================
-- 5. user_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses(id)    ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id)    ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user_course  ON user_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson        ON user_progress(lesson_id);

-- ============================================================
-- 6. quizzes
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);

-- ============================================================
-- 7. quiz_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  options        TEXT NOT NULL,   -- JSON array stored as text
  correct_answer TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qquestions_quiz ON quiz_questions(quiz_id);

-- ============================================================
-- 8. quiz_attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id    UUID NOT NULL REFERENCES quizzes(id)    ON DELETE CASCADE,
  score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qattempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_qattempts_quiz ON quiz_attempts(quiz_id);

-- ============================================================
-- 9. reviews  (unified ratings table — replaces course_ratings)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id)    ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, user_id)  -- طالب = تقييم واحد فقط للكورس
);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user   ON reviews(user_id);

-- ============================================================
-- 10. comments
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID NOT NULL REFERENCES lessons(id)    ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_comments_user   ON comments(user_id);

-- ============================================================
-- 11. wishlist
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES courses(id)    ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- ============================================================
-- 12. classrooms
-- ============================================================
CREATE TABLE IF NOT EXISTS classrooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. classroom_instructors
-- ============================================================
CREATE TABLE IF NOT EXISTS classroom_instructors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id  UUID NOT NULL REFERENCES classrooms(id)  ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(classroom_id, instructor_id)
);
CREATE INDEX IF NOT EXISTS idx_ci_classroom  ON classroom_instructors(classroom_id);
CREATE INDEX IF NOT EXISTS idx_ci_instructor ON classroom_instructors(instructor_id);

-- ============================================================
-- 14. classroom_students
-- ============================================================
CREATE TABLE IF NOT EXISTS classroom_students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id)  ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_cs_classroom ON classroom_students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_cs_student   ON classroom_students(student_id);

-- ============================================================
-- 15. coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_uses      INTEGER DEFAULT NULL,
  used_count    INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ DEFAULT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ============================================================
-- 16. coupon_redemptions
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES coupons(id)        ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cr_user   ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_cr_coupon ON coupon_redemptions(coupon_id);

-- ============================================================
-- 17. certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id)    ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_certs_user   ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certs_course ON certificates(course_id);

-- ============================================================
-- 18. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'general',
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- ============================================================
-- Supabase Storage Bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRIGGER: حماية الأعمدة الحساسة في profiles
-- ============================================================
CREATE OR REPLACE FUNCTION protect_profile_sensitive_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- service_role (Edge Functions) يعدّي بحرية
  IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;
  -- super_admin يعدّي بحرية
  IF is_admin() THEN RETURN NEW; END IF;
  -- المستخدمون العاديون: منع تغيير الأعمدة الحساسة
  IF NEW.role              IS DISTINCT FROM OLD.role   THEN RAISE EXCEPTION 'لا يمكن تغيير الدور'; END IF;
  IF NEW.status            IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'لا يمكن تغيير حالة الحساب'; END IF;
  IF NEW.subscription_type IS DISTINCT FROM OLD.subscription_type THEN
    RAISE EXCEPTION 'لا يمكن تغيير نوع الاشتراك مباشرة';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_profile ON profiles;
CREATE TRIGGER trg_protect_profile BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_sensitive_columns();

-- ============================================================
-- TRIGGER: server-side validation للكوبون عند INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION validate_coupon_on_redemption()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coupon coupons%ROWTYPE;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE id = NEW.coupon_id;
  IF NOT FOUND                                                        THEN RAISE EXCEPTION 'الكوبون غير موجود'; END IF;
  IF NOT v_coupon.is_active                                           THEN RAISE EXCEPTION 'الكوبون غير نشط'; END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN RAISE EXCEPTION 'انتهت صلاحية الكوبون'; END IF;
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'تم استنفاد استخدامات الكوبون';
  END IF;
  UPDATE coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_coupon ON coupon_redemptions;
CREATE TRIGGER trg_validate_coupon BEFORE INSERT ON coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION validate_coupon_on_redemption();

-- ============================================================
-- TRIGGER: إشعار عند قبول الحساب
-- ============================================================
CREATE OR REPLACE FUNCTION notify_account_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications(user_id,type,title,body,link)
    VALUES(NEW.id,'account_approved','✅ تم قبول حسابك!','يمكنك الآن تسجيل الدخول والبدء في التعلم.','/student/courses');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_account_approved ON profiles;
CREATE TRIGGER on_account_approved AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_account_approved();

-- ============================================================
-- TRIGGER: تحويل premium → free عند انتهاء الاشتراك
-- ============================================================
CREATE OR REPLACE FUNCTION auto_expire_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.subscription_expires_at IS NOT NULL
     AND NEW.subscription_expires_at < NOW()
     AND NEW.subscription_type = 'premium' THEN
    NEW.subscription_type      := 'free';
    NEW.payment_coupon          := NULL;
    NEW.subscription_expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_profile_update_expire ON profiles;
CREATE TRIGGER on_profile_update_expire BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_expire_subscription();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select"      ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all"   ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id    = profiles.id
        AND c.instructor_id = auth.uid()
        AND profiles.role   = 'student'
    )
  );
-- profiles INSERT: يمنع حقن أي قيم حساسة من العميل
-- role: student أو instructor فقط (super_admin ممنوع)
-- status: pending فقط (لا يمكن الموافقة على نفسك)
-- subscription_type: free فقط (premium عبر Edge Function فقط)
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (
  id = auth.uid()
  AND role IN ('student', 'instructor')
  AND status = 'pending'
  AND (subscription_type IS NULL OR subscription_type = 'free')
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin()) WITH CHECK (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_admin_all"  ON profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── courses ───────────────────────────────────────────────────
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_auth_select"       ON courses;
DROP POLICY IF EXISTS "courses_instructor_write"  ON courses;
DROP POLICY IF EXISTS "courses_instructor_modify" ON courses;
DROP POLICY IF EXISTS "courses_instructor_delete" ON courses;
-- المستخدم يرى الكورسات المنشورة فقط، والمدرس يرى كورساته، والأدمن يرى الكل
CREATE POLICY "courses_auth_select" ON courses FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    is_published = TRUE
    OR instructor_id = auth.uid()
    OR is_admin()
  )
);
CREATE POLICY "courses_instructor_write"  ON courses FOR INSERT  WITH CHECK (instructor_id = auth.uid() OR is_admin());
CREATE POLICY "courses_instructor_modify" ON courses FOR UPDATE  USING (instructor_id = auth.uid() OR is_admin()) WITH CHECK (instructor_id = auth.uid() OR is_admin());
CREATE POLICY "courses_instructor_delete" ON courses FOR DELETE  USING (instructor_id = auth.uid() OR is_admin());

-- ── lessons ───────────────────────────────────────────────────
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_select"            ON lessons;
DROP POLICY IF EXISTS "lessons_instructor_write"  ON lessons;
DROP POLICY IF EXISTS "lessons_instructor_modify" ON lessons;
DROP POLICY IF EXISTS "lessons_instructor_delete" ON lessons;
CREATE POLICY "lessons_select" ON lessons FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    is_premium = FALSE
    OR EXISTS(SELECT 1 FROM enrollments e JOIN profiles p ON p.id=e.user_id
              WHERE e.course_id=lessons.course_id AND e.user_id=auth.uid() AND p.subscription_type='premium')
    OR EXISTS(SELECT 1 FROM courses c WHERE c.id=lessons.course_id AND c.instructor_id=auth.uid())
    OR is_admin()
  )
);
CREATE POLICY "lessons_instructor_write"  ON lessons FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM courses c WHERE c.id=lessons.course_id AND c.instructor_id=auth.uid()) OR is_admin());
CREATE POLICY "lessons_instructor_modify" ON lessons FOR UPDATE USING (EXISTS(SELECT 1 FROM courses c WHERE c.id=lessons.course_id AND c.instructor_id=auth.uid()) OR is_admin());
CREATE POLICY "lessons_instructor_delete" ON lessons FOR DELETE USING (EXISTS(SELECT 1 FROM courses c WHERE c.id=lessons.course_id AND c.instructor_id=auth.uid()) OR is_admin());

-- ── enrollments ───────────────────────────────────────────────
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enroll_select"       ON enrollments;
DROP POLICY IF EXISTS "enroll_insert_own"   ON enrollments;
DROP POLICY IF EXISTS "enroll_admin_all"    ON enrollments;
CREATE POLICY "enroll_select"     ON enrollments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM courses c WHERE c.id=enrollments.course_id AND c.instructor_id=auth.uid()) OR is_admin());
-- INSERT على enrollments محظور على العميل — يتم حصراً عبر Edge Function enroll-course
-- (التي تتحقق من premium/free قبل التسجيل)
CREATE POLICY "enroll_admin_all"  ON enrollments FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- ── user_progress ─────────────────────────────────────────────
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_own"       ON user_progress;
DROP POLICY IF EXISTS "progress_insert"    ON user_progress;
DROP POLICY IF EXISTS "progress_delete"    ON user_progress;
DROP POLICY IF EXISTS "progress_instructor" ON user_progress;
DROP POLICY IF EXISTS "progress_admin"     ON user_progress;
CREATE POLICY "progress_own"        ON user_progress FOR SELECT  USING (user_id = auth.uid() OR is_admin());
-- INSERT على user_progress: يجب أن يكون المستخدم مسجلاً في الدورة
CREATE POLICY "progress_insert" ON user_progress FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = user_progress.course_id
  )
);
CREATE POLICY "progress_delete"     ON user_progress FOR DELETE  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "progress_instructor" ON user_progress FOR SELECT
  USING (EXISTS(SELECT 1 FROM courses c WHERE c.id=user_progress.course_id AND c.instructor_id=auth.uid()));
CREATE POLICY "progress_admin"      ON user_progress FOR ALL     USING (is_admin()) WITH CHECK (is_admin());

-- ── quizzes ───────────────────────────────────────────────────
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_select"  ON quizzes;
DROP POLICY IF EXISTS "quizzes_write"   ON quizzes;
-- الاختبارات: مرئية لمن هو مسجل في الدورة أو المدرس أو الأدمن
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.course_id = quizzes.course_id)
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = quizzes.course_id AND c.instructor_id = auth.uid())
    OR is_admin()
  )
);
CREATE POLICY "quizzes_write"  ON quizzes FOR ALL
  USING (EXISTS(SELECT 1 FROM courses c WHERE c.id=quizzes.course_id AND c.instructor_id=auth.uid()) OR is_admin())
  WITH CHECK (EXISTS(SELECT 1 FROM courses c WHERE c.id=quizzes.course_id AND c.instructor_id=auth.uid()) OR is_admin());

-- ── quiz_questions ────────────────────────────────────────────
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qquestions_select" ON quiz_questions;
DROP POLICY IF EXISTS "qquestions_write"  ON quiz_questions;
-- أسئلة الاختبار: المستخدم لازم يكون مسجلاً في دورة الاختبار
CREATE POLICY "qquestions_select" ON quiz_questions FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN quizzes q ON q.course_id = e.course_id
      WHERE e.user_id = auth.uid()
        AND q.id = quiz_questions.quiz_id
    )
    OR EXISTS (
      SELECT 1 FROM quizzes q
      JOIN courses c ON c.id = q.course_id
      WHERE q.id = quiz_questions.quiz_id
        AND c.instructor_id = auth.uid()
    )
    OR is_admin()
  )
);
CREATE POLICY "qquestions_write"  ON quiz_questions FOR ALL
  USING (EXISTS(SELECT 1 FROM quizzes q JOIN courses c ON c.id=q.course_id WHERE q.id=quiz_questions.quiz_id AND c.instructor_id=auth.uid()) OR is_admin())
  WITH CHECK (EXISTS(SELECT 1 FROM quizzes q JOIN courses c ON c.id=q.course_id WHERE q.id=quiz_questions.quiz_id AND c.instructor_id=auth.uid()) OR is_admin());

-- ── quiz_attempts ─────────────────────────────────────────────
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qattempts_own"    ON quiz_attempts;
DROP POLICY IF EXISTS "qattempts_insert" ON quiz_attempts;
DROP POLICY IF EXISTS "qattempts_admin"  ON quiz_attempts;
CREATE POLICY "qattempts_own"    ON quiz_attempts FOR SELECT USING (user_id = auth.uid() OR is_admin());
-- حل الاختبار: المستخدم لازم يكون مسجلاً في دورة الاختبار
CREATE POLICY "qattempts_insert" ON quiz_attempts FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM enrollments e
    JOIN quizzes q ON q.course_id = e.course_id
    WHERE e.user_id = auth.uid()
      AND q.id = quiz_attempts.quiz_id
  )
);
CREATE POLICY "qattempts_admin"  ON quiz_attempts FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- ── reviews (unified — replaces course_ratings) ───────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select"  ON reviews;
DROP POLICY IF EXISTS "reviews_insert"  ON reviews;
DROP POLICY IF EXISTS "reviews_delete"  ON reviews;
DROP POLICY IF EXISTS "reviews_admin"   ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (auth.uid() IS NOT NULL);
-- تقييم الكورس: المستخدم لازم يكون مسجلاً فيه
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = reviews.course_id
  )
);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "reviews_admin"  ON reviews FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- ── comments ──────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (auth.uid() IS NOT NULL);
-- التعليق على درس: لازم يكون مسجلاً في دورة الدرس
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM enrollments e
    JOIN lessons l ON l.course_id = e.course_id
    WHERE e.user_id = auth.uid()
      AND l.id = comments.lesson_id
  )
);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ── wishlist ──────────────────────────────────────────────────
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlist_own"    ON wishlist;
DROP POLICY IF EXISTS "wishlist_insert" ON wishlist;
DROP POLICY IF EXISTS "wishlist_delete" ON wishlist;
CREATE POLICY "wishlist_own"    ON wishlist FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wishlist_insert" ON wishlist FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wishlist_delete" ON wishlist FOR DELETE USING (user_id = auth.uid());

-- ── classrooms ────────────────────────────────────────────────
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classrooms_select"    ON classrooms;
DROP POLICY IF EXISTS "classrooms_admin_all" ON classrooms;
CREATE POLICY "classrooms_select" ON classrooms FOR SELECT
  USING (is_admin()
    OR EXISTS(SELECT 1 FROM classroom_instructors ci WHERE ci.classroom_id=classrooms.id AND ci.instructor_id=auth.uid())
    OR EXISTS(SELECT 1 FROM classroom_students   cs WHERE cs.classroom_id=classrooms.id AND cs.student_id=auth.uid()));
CREATE POLICY "classrooms_admin_all" ON classrooms FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── classroom_instructors ─────────────────────────────────────
ALTER TABLE classroom_instructors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ci_select"    ON classroom_instructors;
DROP POLICY IF EXISTS "ci_admin_all" ON classroom_instructors;
CREATE POLICY "ci_select"    ON classroom_instructors FOR SELECT
  USING (instructor_id = auth.uid() OR is_admin());
CREATE POLICY "ci_admin_all" ON classroom_instructors FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── classroom_students ────────────────────────────────────────
ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cs_select"    ON classroom_students;
DROP POLICY IF EXISTS "cs_admin_all" ON classroom_students;
CREATE POLICY "cs_select" ON classroom_students FOR SELECT
  USING (student_id = auth.uid()
    OR EXISTS(SELECT 1 FROM classroom_instructors ci WHERE ci.classroom_id=classroom_students.classroom_id AND ci.instructor_id=auth.uid())
    OR is_admin());
CREATE POLICY "cs_admin_all" ON classroom_students FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── coupons ───────────────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_admin_all" ON coupons;
-- لا SELECT للمستخدم العادي — كل التحقق يمر بـ Edge Function (service_role)
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── coupon_redemptions ────────────────────────────────────────
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cr_select_own"  ON coupon_redemptions;
DROP POLICY IF EXISTS "cr_insert_own"  ON coupon_redemptions;
DROP POLICY IF EXISTS "cr_admin_all"   ON coupon_redemptions;
CREATE POLICY "cr_select_own" ON coupon_redemptions FOR SELECT USING (user_id = auth.uid());
-- INSERT على coupon_redemptions: محظور على العميل المباشر
-- يتم حصراً عبر Edge Functions (redeem-coupon / register-premium)
CREATE POLICY "cr_admin_all"  ON coupon_redemptions FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- ── certificates ─────────────────────────────────────────────
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_select_own" ON certificates;
DROP POLICY IF EXISTS "cert_admin_all"  ON certificates;
-- INSERT محظور على العميل المباشر — يتم فقط عبر Edge Function issue-certificate
CREATE POLICY "cert_select_own" ON certificates FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "cert_admin_all"  ON certificates FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- ── notifications ─────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select_own"  ON notifications;
DROP POLICY IF EXISTS "notif_update_own"  ON notifications;
DROP POLICY IF EXISTS "notif_admin_all"   ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_admin_all"  ON notifications FOR ALL   USING (is_admin()) WITH CHECK (is_admin());


-- ── VIEW: leaderboard (SECURITY DEFINER — آمن ومخصص لصفحة الشرف) ──────────
CREATE OR REPLACE VIEW leaderboard_view
WITH (security_invoker = false)
AS
SELECT
  p.id,
  COALESCE(p.full_name, p.username, 'طالب') AS name,
  COALESCE(
    (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = p.id AND up.is_completed = TRUE),
    0
  ) AS completed_lessons,
  COALESCE(
    (SELECT COUNT(*) FROM certificates cert WHERE cert.user_id = p.id),
    0
  ) AS certificates,
  COALESCE(
    (SELECT ROUND(AVG(qa.score)) FROM quiz_attempts qa WHERE qa.user_id = p.id),
    0
  ) AS quiz_avg
FROM profiles p
WHERE p.role = 'student'
  AND p.status = 'approved';

-- منح الصلاحية للمستخدمين المسجلين
GRANT SELECT ON leaderboard_view TO authenticated;


-- ============================================================
-- FUNCTION: redeem_coupon_atomic
-- عملية ذرية كاملة في transaction واحدة:
-- 1. قفل صف الكوبون (SELECT FOR UPDATE)
-- 2. التحقق من الصلاحية
-- 3. زيادة used_count
-- 4. إدراج redemption row
-- 5. تحديث subscription في profile
-- تُستدعى من Edge Functions بدلاً من العمليات المتسلسلة
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_coupon_atomic(
  p_user_id    UUID,
  p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon  coupons%ROWTYPE;
  v_expiry  TIMESTAMPTZ;
BEGIN
  -- قفل الصف لمنع race conditions
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_coupon_code))
    AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'كود الكوبون غير صحيح أو غير نشط');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'انتهت صلاحية هذا الكوبون');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('error', 'تم استنفاد استخدامات هذا الكوبون');
  END IF;

  IF EXISTS (
    SELECT 1 FROM coupon_redemptions
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'لقد استخدمت هذا الكوبون من قبل');
  END IF;

  -- حساب تاريخ الانتهاء
  v_expiry := NOW() + (v_coupon.duration_days || ' days')::INTERVAL;

  -- كل العمليات في transaction واحدة:

  -- 1. زيادة عداد الاستخدام
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = v_coupon.id;

  -- 2. تسجيل الـ redemption
  INSERT INTO coupon_redemptions (coupon_id, user_id)
  VALUES (v_coupon.id, p_user_id);

  -- 3. تحديث الاشتراك في profile
  UPDATE profiles
  SET
    subscription_type       = 'premium',
    payment_coupon          = UPPER(TRIM(p_coupon_code)),
    subscription_expires_at = v_expiry
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',    true,
    'expires_at', v_expiry,
    'message',    '✅ تم تفعيل الاشتراك البريميوم بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- منح الصلاحية لـ service_role فقط
REVOKE ALL ON FUNCTION redeem_coupon_atomic FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION redeem_coupon_atomic TO service_role;

-- ============================================================
-- FUNCTION: validate_coupon_only
-- للتحقق من صلاحية الكوبون فقط بدون استهلاك (Register flow)
-- ============================================================
CREATE OR REPLACE FUNCTION validate_coupon_only(
  p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_expiry TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_coupon_code))
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'كود الكوبون غير صحيح أو غير نشط');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'انتهت صلاحية هذا الكوبون');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'تم استنفاد استخدامات هذا الكوبون');
  END IF;

  v_expiry := NOW() + (v_coupon.duration_days || ' days')::INTERVAL;

  RETURN jsonb_build_object(
    'valid',         true,
    'coupon_id',     v_coupon.id,
    'duration_days', v_coupon.duration_days,
    'expires_at',    v_expiry
  );
END;
$$;

REVOKE ALL ON FUNCTION validate_coupon_only FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_coupon_only TO service_role;

-- ============================================================
-- Seed: Super Admin
-- ============================================================
-- بعد إنشاء حساب ADMIN0 عبر Supabase Auth، شغّل:
-- UPDATE profiles SET role = 'super_admin', status = 'approved' WHERE email = 'admin@yourdomain.com';

-- ============================================================
SELECT 'Academy v6 — Full Migration completed ✅' AS status;
-- ============================================================
