import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Trash2, Loader2, CheckCircle2, XCircle, PlusCircle,
  BookOpen, ClipboardList, GripVertical, ArrowUp, ArrowDown,
  Lock, Unlock, Edit3, Save, X
} from 'lucide-react'

export default function CourseEditor() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes'>('lessons')
  const [courseTitle, setCourseTitle] = useState('')

  const [lessons, setLessons] = useState<any[]>([])
  const [lessonTitle, setLessonTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [isPremiumLesson, setIsPremiumLesson] = useState(false)
  const [reordering, setReordering] = useState(false)

  const [quizzes, setQuizzes] = useState<any[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [qText, setQText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIdx, setCorrectIdx] = useState(0)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  useEffect(() => {
    if (!courseId) return
    supabase.from('courses').select('title').eq('id', courseId).single()
      .then(({ data }) => { if (data) setCourseTitle(data.title) })
    loadLessons(); loadQuizzes()
  }, [courseId])

  const loadLessons = async () => {
    const { data } = await supabase.from('lessons').select('*')
      .eq('course_id', courseId).order('order_index', { ascending: true })
    if (data) setLessons(data)
  }

  const loadQuizzes = async () => {
    const { data } = await supabase.from('quizzes').select('*')
      .eq('course_id', courseId).order('created_at', { ascending: false })
    if (data) setQuizzes(data)
  }

  const loadQuestions = async (quizId: string) => {
    const { data } = await supabase.from('quiz_questions').select('*')
      .eq('quiz_id', quizId).order('created_at', { ascending: true })
    if (data) setQuestions(data)
  }

  // ── Lesson CRUD ──
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      let uploadedFileUrl: string | null = null
      if (fileInput) {
        const ext = fileInput.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('course-materials').upload(`books/${fileName}`, fileInput)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(`books/${fileName}`)
        uploadedFileUrl = publicUrl
      }
      // Find next order index properly
      const maxOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index || 0)) : 0
      const { error } = await supabase.from('lessons').insert({
        course_id: courseId,
        title: lessonTitle,
        video_url: videoUrl.trim() || null,
        file_url: uploadedFileUrl,
        order_index: maxOrder + 1,
        is_premium: isPremiumLesson })
      if (error) throw error
      showMsg('✅ تم إضافة الدرس بنجاح', 'success')
      setLessonTitle(''); setVideoUrl(''); setFileInput(null); setIsPremiumLesson(false)
      loadLessons()
    } catch (err: any) { showMsg(err.message, 'error') }
    finally { setLoading(false) }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل تريد حذف هذا الدرس؟')) return
    await supabase.from('lessons').delete().eq('id', lessonId)
    showMsg('✅ تم حذف الدرس', 'success')
    loadLessons()
  }

  const handleTogglePremium = async (lessonId: string, current: boolean) => {
    await supabase.from('lessons').update({ is_premium: !current }).eq('id', lessonId)
    loadLessons()
  }

  const handleSaveTitle = async (lessonId: string) => {
    if (!editTitle.trim()) return
    await supabase.from('lessons').update({ title: editTitle }).eq('id', lessonId)
    setEditingLesson(null)
    loadLessons()
  }

  // ── Reorder: Move up / Move down ──
  const handleMove = async (idx: number, dir: 'up' | 'down') => {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= lessons.length) return
    setReordering(true)
    const a = lessons[idx]
    const b = lessons[swapIdx]
    // Swap order_index values
    await Promise.all([
      supabase.from('lessons').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('lessons').update({ order_index: a.order_index }).eq('id', b.id),
    ])
    await loadLessons()
    setReordering(false)
  }

  // ── Quiz CRUD ──
  const safeParseOptions = (raw: any): string[] => {
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
  }

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data, error } = await supabase.from('quizzes').insert({ course_id: courseId, title: quizTitle }).select().single()
      if (error) throw error
      showMsg('✅ تم إنشاء الاختبار', 'success')
      setQuizTitle(''); loadQuizzes()
      setSelectedQuizId(data.id); loadQuestions(data.id)
    } catch (err: any) { showMsg(err.message, 'error') }
    finally { setLoading(false) }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('حذف هذا الاختبار وجميع أسئلته؟')) return
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId)
    await supabase.from('quizzes').delete().eq('id', quizId)
    showMsg('✅ تم حذف الاختبار', 'success')
    if (selectedQuizId === quizId) { setSelectedQuizId(null); setQuestions([]) }
    loadQuizzes()
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuizId || options.some(o => !o.trim())) {
      showMsg('يرجى ملء جميع الخيارات', 'error'); return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('quiz_questions').insert({
        quiz_id: selectedQuizId,
        question: qText,
        options: JSON.stringify(options),
        correct_answer: options[correctIdx] })
      if (error) throw error
      showMsg('✅ تم إضافة السؤال', 'success')
      setQText(''); setOptions(['','','','']); setCorrectIdx(0)
      loadQuestions(selectedQuizId)
    } catch (err: any) { showMsg(err.message, 'error') }
    finally { setLoading(false) }
  }

  const handleDeleteQuestion = async (qId: string) => {
    await supabase.from('quiz_questions').delete().eq('id', qId)
    if (selectedQuizId) loadQuestions(selectedQuizId)
  }

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="max-w-4xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/instructor/courses')}
            className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}>
            ←
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              محرر الدورة: {courseTitle}
            </h1>
            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              أضف الدروس والاختبارات ورتّب المحتوى
            </p>
          </div>
        </div>

        {msg.text && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 font-bold text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: 'var(--bg-input)' }}>
          {([['lessons','الدروس',BookOpen],['quizzes','الاختبارات',ClipboardList]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === key ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              style={activeTab === key ? {} : {}}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── LESSONS TAB ── */}
        {activeTab === 'lessons' && (
          <div className="space-y-5">
            {/* Add Lesson Form */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <PlusCircle className="w-5 h-5 text-blue-600" /> إضافة درس جديد
              </h3>
              <form onSubmit={handleAddLesson} className="space-y-3">
                <input type="text" required value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                  placeholder="عنوان الدرس *"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none transition-all focus:border-blue-400"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="رابط الفيديو (YouTube/Drive)"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none transition-all focus:border-blue-400"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  dir="ltr" />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="file" className="hidden"
                      onChange={e => setFileInput(e.target.files?.[0] || null)} />
                    <span className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors hover:border-blue-400"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      📎 {fileInput ? fileInput.name : 'رفع مرفق'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={isPremiumLesson} onChange={e => setIsPremiumLesson(e.target.checked)}
                      className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-bold text-amber-600">🔒 درس مدفوع</span>
                  </label>
                </div>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  إضافة الدرس
                </button>
              </form>
            </div>

            {/* Lessons List with reorder */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  قائمة الدروس ({lessons.length})
                </h3>
                {reordering && <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> جاري الحفظ...</span>}
              </div>

              {lessons.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold" style={{ color: 'var(--text-muted)' }}>لا توجد دروس بعد</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-3 p-3">
                      {/* Drag indicator */}
                      <GripVertical className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />

                      {/* Order number */}
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                        {idx + 1}
                      </span>

                      {/* Title (editable) */}
                      <div className="flex-1 min-w-0">
                        {editingLesson === lesson.id ? (
                          <div className="flex items-center gap-2">
                            <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border text-sm font-bold outline-none"
                              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                            <button onClick={() => handleSaveTitle(lesson.id)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingLesson(null)} className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{lesson.title}</span>
                            {lesson.is_premium && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-black">مدفوع</span>}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move up/down */}
                        <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0 || reordering}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-slate-100"
                          style={{ color: 'var(--text-muted)' }}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleMove(idx, 'down')} disabled={idx === lessons.length - 1 || reordering}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-slate-100"
                          style={{ color: 'var(--text-muted)' }}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit title */}
                        <button onClick={() => { setEditingLesson(lesson.id); setEditTitle(lesson.title) }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-600"
                          style={{ color: 'var(--text-muted)' }}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {/* Toggle premium */}
                        <button onClick={() => handleTogglePremium(lesson.id, lesson.is_premium)}
                          className={`p-1.5 rounded-lg transition-colors ${lesson.is_premium ? 'text-amber-500 hover:bg-amber-50' : 'hover:bg-slate-100'}`}
                          style={!lesson.is_premium ? { color: 'var(--text-muted)' } : {}}
                          title={lesson.is_premium ? 'تحويل لمجاني' : 'تحويل لمدفوع'}>
                          {lesson.is_premium ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                          style={{ color: 'var(--text-muted)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── QUIZZES TAB ── */}
        {activeTab === 'quizzes' && (
          <div className="space-y-5">
            {/* Create Quiz */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <PlusCircle className="w-5 h-5 text-indigo-600" /> إنشاء اختبار جديد
              </h3>
              <form onSubmit={handleCreateQuiz} className="flex gap-3">
                <input type="text" required value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                  placeholder="عنوان الاختبار *" className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold outline-none focus:border-indigo-400"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  إنشاء
                </button>
              </form>
            </div>

            {/* Quiz list */}
            {quizzes.length > 0 && (
              <div className="space-y-3">
                {quizzes.map(q => (
                  <div key={q.id}
                    className={`rounded-2xl border overflow-hidden transition-all cursor-pointer ${selectedQuizId === q.id ? 'border-indigo-400' : ''}`}
                    style={{ background: 'var(--bg-card)', borderColor: selectedQuizId === q.id ? undefined : 'var(--border-color)' }}>
                    <div className="p-4 flex items-center gap-3"
                      onClick={() => { setSelectedQuizId(q.id === selectedQuizId ? null : q.id); if (q.id !== selectedQuizId) loadQuestions(q.id) }}>
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{q.title}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteQuiz(q.id) }}
                        className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                        style={{ color: 'var(--text-muted)' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedQuizId === q.id && (
                      <div className="border-t p-4 space-y-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-app)' }}>
                        {/* Questions */}
                        {questions.length > 0 && (
                          <div className="space-y-2">
                            {questions.map((question, qi) => (
                              <div key={question.id} className="p-3 rounded-xl border text-sm"
                                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="font-black" style={{ color: 'var(--text-primary)' }}>{qi + 1}. {question.question}</span>
                                  <button onClick={() => handleDeleteQuestion(question.id)}
                                    className="p-1 rounded hover:text-red-500" style={{ color: 'var(--text-muted)' }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  {safeParseOptions(question.options).map((opt: string, oi: number) => (
                                    <span key={oi}
                                      className={`text-xs px-2 py-1 rounded-lg font-bold ${opt === question.correct_answer ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-500'}`}>
                                      {opt === question.correct_answer ? '✓ ' : ''}{opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Question */}
                        <form onSubmit={handleAddQuestion} className="space-y-3 p-3 rounded-xl border border-dashed"
                          style={{ borderColor: 'var(--border-color)' }}>
                          <p className="text-xs font-black" style={{ color: 'var(--text-secondary)' }}>➕ إضافة سؤال جديد</p>
                          <input type="text" required value={qText} onChange={e => setQText(e.target.value)}
                            placeholder="نص السؤال *" className="w-full px-3 py-2 rounded-lg border text-sm font-bold outline-none"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                          <div className="grid grid-cols-2 gap-2">
                            {options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio" name="correct" checked={correctIdx === oi}
                                  onChange={() => setCorrectIdx(oi)} className="accent-green-600 shrink-0" />
                                <input type="text" required value={opt}
                                  onChange={e => { const o = [...options]; o[oi] = e.target.value; setOptions(o) }}
                                  placeholder={`خيار ${oi + 1}`}
                                  className="flex-1 px-2 py-1.5 rounded-lg border text-xs font-bold outline-none"
                                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] font-bold text-green-600">الدائرة الخضراء = الإجابة الصحيحة</p>
                          <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs transition-all disabled:opacity-50">
                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                            إضافة السؤال
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
