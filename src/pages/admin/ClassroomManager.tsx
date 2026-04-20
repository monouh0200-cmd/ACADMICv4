import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  School, PlusCircle, Loader2, ArrowRight, Users,
  Trash2, ChevronDown, ChevronUp, UserPlus, X,
  CheckCircle2, GraduationCap, Search
} from 'lucide-react'

export default function ClassroomManager() {
  const navigate = useNavigate()
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'instructors' | 'students'>>({})

  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [studentSearch, setStudentSearch] = useState<Record<string, string>>({})

  const [msg, setMsg] = useState({ text: '', type: '' })
  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const [{ data: rooms }, { data: instr }, { data: students }] = await Promise.all([
      supabase.from('classrooms').select(`
        *,
        classroom_instructors(*, profiles(id,username,specialization,email)),
        classroom_students(*, profiles(id,username,full_name,email,study_year))
      `).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,username,specialization,email')
        .eq('role','instructor').eq('status','approved').order('username'),
      supabase.from('profiles').select('id,username,full_name,email,study_year')
        .eq('role','student').eq('status','approved').order('username'),
    ])
    if (rooms) setClassrooms(rooms)
    if (instr) setInstructors(instr)
    if (students) setAllStudents(students)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const { error } = await supabase.from('classrooms').insert({ name: newName.trim(), description: newDesc.trim() || null })
    if (error) showMsg('فشل إنشاء الفصل: ' + error.message, 'error')
    else { showMsg('✅ تم إنشاء الفصل بنجاح', 'success'); setNewName(''); setNewDesc(''); setShowForm(false); loadData() }
    setCreating(false)
  }

  const handleDeleteClassroom = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الفصل؟')) return
    await supabase.from('classroom_instructors').delete().eq('classroom_id', id)
    await supabase.from('classroom_students').delete().eq('classroom_id', id)
    const { error } = await supabase.from('classrooms').delete().eq('id', id)
    if (error) showMsg('فشل حذف الفصل', 'error')
    else { showMsg('✅ تم حذف الفصل', 'success'); loadData() }
  }

  // ── Instructors ──
  const handleAddInstructor = async (classroomId: string, instructorId: string) => {
    const room = classrooms.find(r => r.id === classroomId)
    if (room?.classroom_instructors?.some((ci: any) => ci.instructor_id === instructorId)) {
      showMsg('المدرس موجود بالفعل', 'error'); return
    }
    const { error } = await supabase.from('classroom_instructors').insert({ classroom_id: classroomId, instructor_id: instructorId })
    if (error) showMsg('فشل إضافة المدرس', 'error')
    else { showMsg('✅ تم إضافة المدرس', 'success'); loadData() }
  }

  const handleRemoveInstructor = async (classroomId: string, instructorId: string) => {
    const { error } = await supabase.from('classroom_instructors').delete()
      .eq('classroom_id', classroomId).eq('instructor_id', instructorId)
    if (error) showMsg('فشل إزالة المدرس', 'error')
    else { showMsg('✅ تم إزالة المدرس', 'success'); loadData() }
  }

  // ── Students ──
  const handleAddStudent = async (classroomId: string, studentId: string) => {
    const room = classrooms.find(r => r.id === classroomId)
    if (room?.classroom_students?.some((cs: any) => cs.student_id === studentId)) {
      showMsg('الطالب موجود بالفعل في هذا الفصل', 'error'); return
    }
    const { error } = await supabase.from('classroom_students').insert({ classroom_id: classroomId, student_id: studentId })
    if (error) showMsg('فشل إضافة الطالب: ' + error.message, 'error')
    else { showMsg('✅ تم إضافة الطالب للفصل', 'success'); loadData() }
  }

  const handleRemoveStudent = async (classroomId: string, studentId: string) => {
    const { error } = await supabase.from('classroom_students').delete()
      .eq('classroom_id', classroomId).eq('student_id', studentId)
    if (error) showMsg('فشل إزالة الطالب', 'error')
    else { showMsg('✅ تم إزالة الطالب من الفصل', 'success'); loadData() }
  }

  const getAvailableInstructors = (classroomId: string) => {
    const room = classrooms.find(r => r.id === classroomId)
    const ids = room?.classroom_instructors?.map((ci: any) => ci.instructor_id) || []
    return instructors.filter(i => !ids.includes(i.id))
  }

  const getAvailableStudents = (classroomId: string, search: string) => {
    const room = classrooms.find(r => r.id === classroomId)
    const ids = room?.classroom_students?.map((cs: any) => cs.student_id) || []
    return allStudents
      .filter(s => !ids.includes(s.id))
      .filter(s => !search || (s.username + ' ' + s.full_name + ' ' + s.email).toLowerCase().includes(search.toLowerCase()))
  }

  const getTab = (id: string) => activeTab[id] || 'instructors'

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--bg-app)' }} dir="rtl">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <School className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>الفصول الدراسية</h1>
              <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                إنشاء فصول وإضافة مدرسين وطلاب لكل فصل
              </p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all">
            <PlusCircle className="w-4 h-4" /> فصل جديد
          </button>
        </div>

        {msg.text && (
          <div className={`p-3 rounded-xl flex items-center gap-2 font-bold text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg.text}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h2 className="font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <PlusCircle className="w-5 h-5 text-indigo-600" /> إنشاء فصل جديد
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="اسم الفصل *"
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none transition-all focus:border-indigo-400"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="وصف الفصل (اختياري)" rows={2}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all resize-none focus:border-indigo-400"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <div className="flex gap-2">
                <button type="submit" disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  إنشاء الفصل
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classrooms */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--border-color)' }}>
            <School className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
            <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>لا توجد فصول بعد — اضغط "فصل جديد" للبدء</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classrooms.map(room => {
              const isExp = expandedRoom === room.id
              const tab = getTab(room.id)
              const assignedInstructors = room.classroom_instructors || []
              const assignedStudents = room.classroom_students || []
              const availInstr = getAvailableInstructors(room.id)
              const srch = studentSearch[room.id] || ''
              const availStudents = getAvailableStudents(room.id, srch)

              return (
                <div key={room.id} className="rounded-2xl border overflow-hidden"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

                  {/* Room Header */}
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <School className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{room.name}</h3>
                      {room.description && <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{room.description}</p>}
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                          <Users className="w-3.5 h-3.5" /> {assignedInstructors.length} مدرس
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
                          <GraduationCap className="w-3.5 h-3.5" /> {assignedStudents.length} طالب
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedRoom(isExp ? null : room.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors">
                        إدارة {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleDeleteClassroom(room.id)}
                        className="p-2 rounded-xl transition-colors hover:bg-red-50 hover:text-red-500"
                        style={{ color: 'var(--text-muted)' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  {isExp && (
                    <div className="border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-app)' }}>
                      {/* Tabs */}
                      <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                          onClick={() => setActiveTab(t => ({ ...t, [room.id]: 'instructors' }))}
                          className={`flex-1 py-3 text-sm font-black flex items-center justify-center gap-2 transition-colors ${tab === 'instructors' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Users className="w-4 h-4" /> المدرسون ({assignedInstructors.length})
                        </button>
                        <button
                          onClick={() => setActiveTab(t => ({ ...t, [room.id]: 'students' }))}
                          className={`flex-1 py-3 text-sm font-black flex items-center justify-center gap-2 transition-colors ${tab === 'students' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>
                          <GraduationCap className="w-4 h-4" /> الطلاب ({assignedStudents.length})
                        </button>
                      </div>

                      <div className="p-5 space-y-5">

                        {/* ── INSTRUCTORS TAB ── */}
                        {tab === 'instructors' && (
                          <>
                            {/* Assigned */}
                            <div>
                              <h4 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Users className="w-4 h-4 text-indigo-600" /> مدرسو هذا الفصل
                              </h4>
                              {assignedInstructors.length === 0 ? (
                                <p className="text-xs font-bold text-center py-4 rounded-xl border border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                                  لم يتم تعيين مدرسين بعد
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {assignedInstructors.map((ci: any) => (
                                    <div key={ci.instructor_id}
                                      className="flex items-center gap-3 p-3 rounded-xl border"
                                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                      <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                                        {(ci.profiles?.username || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>{ci.profiles?.username}</p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{ci.profiles?.specialization || ci.profiles?.email}</p>
                                      </div>
                                      <button onClick={() => handleRemoveInstructor(room.id, ci.instructor_id)}
                                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                                        style={{ color: 'var(--text-muted)' }}>
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add instructors */}
                            {availInstr.length > 0 && (
                              <div>
                                <h4 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                  <UserPlus className="w-4 h-4 text-indigo-600" /> إضافة مدرس للفصل
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {availInstr.map((instr: any) => (
                                    <button key={instr.id} onClick={() => handleAddInstructor(room.id, instr.id)}
                                      className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:border-indigo-400 hover:bg-indigo-50 group"
                                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                                        {instr.username?.charAt(0)?.toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{instr.username}</p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{instr.specialization || instr.email}</p>
                                      </div>
                                      <PlusCircle className="w-4 h-4 shrink-0 transition-colors group-hover:text-indigo-600" style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* ── STUDENTS TAB ── */}
                        {tab === 'students' && (
                          <>
                            {/* Enrolled Students */}
                            <div>
                              <h4 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <GraduationCap className="w-4 h-4 text-blue-600" /> طلاب هذا الفصل ({assignedStudents.length})
                              </h4>
                              {assignedStudents.length === 0 ? (
                                <p className="text-xs font-bold text-center py-4 rounded-xl border border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                                  لم يتم إضافة طلاب بعد
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {assignedStudents.map((cs: any) => (
                                    <div key={cs.student_id}
                                      className="flex items-center gap-3 p-3 rounded-xl border"
                                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                                        {(cs.profiles?.full_name || cs.profiles?.username || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                          {cs.profiles?.full_name || cs.profiles?.username}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                          {cs.profiles?.study_year || cs.profiles?.email}
                                        </p>
                                      </div>
                                      <button onClick={() => handleRemoveStudent(room.id, cs.student_id)}
                                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                                        style={{ color: 'var(--text-muted)' }}>
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add Students */}
                            <div>
                              <h4 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <UserPlus className="w-4 h-4 text-blue-600" /> إضافة طالب للفصل
                              </h4>
                              <div className="relative mb-3">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                  type="text"
                                  placeholder="ابحث باسم الطالب أو البريد..."
                                  value={srch}
                                  onChange={e => setStudentSearch(prev => ({ ...prev, [room.id]: e.target.value }))}
                                  className="w-full pr-9 pl-3 py-2 rounded-xl border text-sm font-bold outline-none transition-all focus:border-blue-400"
                                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                />
                              </div>
                              {availStudents.length === 0 ? (
                                <p className="text-xs font-bold text-center py-3" style={{ color: 'var(--text-muted)' }}>
                                  {srch ? 'لا توجد نتائج' : 'جميع الطلاب مضافون بالفعل'}
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {availStudents.slice(0, 20).map((s: any) => (
                                    <button key={s.id} onClick={() => handleAddStudent(room.id, s.id)}
                                      className="flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:border-blue-400 hover:bg-blue-50 group"
                                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600"
                                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                                        {(s.full_name || s.username || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0 text-right">
                                        <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{s.full_name || s.username}</p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.study_year || s.email}</p>
                                      </div>
                                      <PlusCircle className="w-4 h-4 shrink-0 transition-colors group-hover:text-blue-600" style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
