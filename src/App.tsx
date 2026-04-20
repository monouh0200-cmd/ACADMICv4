import { HashRouter, Routes, Route } from 'react-router-dom'

// Public
import Landing          from './pages/Landing'
import Login            from './pages/auth/Login'
import Register         from './pages/auth/Register'
import ForgotPassword   from './pages/auth/ForgotPassword'
import ResetPassword    from './pages/auth/ResetPassword'
import NotFound         from './pages/NotFound'
import Onboarding       from './pages/Onboarding'

// Core
import Dashboard        from './pages/Dashboard'

// Admin
import UserManagement   from './pages/admin/UserManagement'
import PremiumManager   from './pages/admin/PremiumManager'
import ContentManager   from './pages/admin/ContentManager'
import ClassroomManager from './pages/admin/ClassroomManager'
import Analytics        from './pages/admin/Analytics'

// Instructor
import InstructorProfile from './pages/instructor/InstructorProfile'
import Courses           from './pages/instructor/Courses'
import CourseEditor      from './pages/instructor/CourseEditor'
import CourseComments    from './pages/instructor/CourseComments'
import StudentResults    from './pages/instructor/StudentResults'

// Student
import CourseList        from './pages/student/CourseList'
import CourseDetails     from './pages/student/CourseDetails'
import MyCourses         from './pages/student/MyCourses'
import CourseView        from './pages/student/CourseView'
import QuizList          from './pages/student/QuizList'
import QuizAttempt       from './pages/student/QuizAttempt'
import MyResults         from './pages/student/MyResults'
import RedeemCoupon      from './pages/student/RedeemCoupon'
import Certificate       from './pages/student/Certificate'
import MyCertificates    from './pages/student/MyCertificates'
import Wishlist          from './pages/student/Wishlist'
import Settings          from './pages/student/Settings'
import Leaderboard       from './pages/student/Leaderboard'

// Auth guard
import ProtectedRoute    from './components/ProtectedRoute'

function App() {
  return (
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Auth-required ── */}
        <Route path="/onboarding"  element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* ── Admin ── */}
        <Route path="/admin/users"      element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/premium"    element={<ProtectedRoute><PremiumManager /></ProtectedRoute>} />
        <Route path="/admin/content"    element={<ProtectedRoute><ContentManager /></ProtectedRoute>} />
        <Route path="/admin/classrooms" element={<ProtectedRoute><ClassroomManager /></ProtectedRoute>} />
        <Route path="/admin/analytics"  element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

        {/* ── Instructor ── */}
        <Route path="/instructor/profile"          element={<ProtectedRoute><InstructorProfile /></ProtectedRoute>} />
        <Route path="/instructor/courses"          element={<ProtectedRoute><Courses /></ProtectedRoute>} />
        <Route path="/instructor/course/:courseId" element={<ProtectedRoute><CourseEditor /></ProtectedRoute>} />
        <Route path="/instructor/comments"         element={<ProtectedRoute><CourseComments /></ProtectedRoute>} />
        <Route path="/instructor/results"          element={<ProtectedRoute><StudentResults /></ProtectedRoute>} />

        {/* ── Student ── */}
        <Route path="/student/courses"                  element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
        <Route path="/student/course-details/:courseId" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
        <Route path="/student/my-courses"               element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        <Route path="/student/course/:courseId"         element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
        <Route path="/student/quizzes/:courseId"        element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
        <Route path="/student/quiz/:quizId"             element={<ProtectedRoute><QuizAttempt /></ProtectedRoute>} />
        <Route path="/student/results"                  element={<ProtectedRoute><MyResults /></ProtectedRoute>} />
        <Route path="/student/redeem"                   element={<ProtectedRoute><RedeemCoupon /></ProtectedRoute>} />
        <Route path="/student/certificate/:courseId"    element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
        <Route path="/student/my-certs"                 element={<ProtectedRoute><MyCertificates /></ProtectedRoute>} />
        <Route path="/student/wishlist"                 element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/student/settings"                 element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/student/leaderboard"              element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}

export default App