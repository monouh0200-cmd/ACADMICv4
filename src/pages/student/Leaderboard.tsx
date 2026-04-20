import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Trophy, Medal, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SkeletonRow } from '../../components/Skeleton'

type Leader = {
  id: string; name: string; completedLessons: number
  certificates: number; quizAvg: number; points: number; rank: number
}

const MEDAL: Record<number, { icon: any; color: string; bg: string }> = {
  1: { icon: Trophy, color: 'text-amber-500',  bg: 'bg-amber-50' },
  2: { icon: Medal,  color: 'text-slate-400',  bg: 'bg-slate-50' },
  3: { icon: Medal,  color: 'text-orange-400', bg: 'bg-orange-50' },
}

export default function Leaderboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<Leader | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // استخدام leaderboard_view — view آمن بصلاحيات محددة، يتجاوز قيود RLS المعقدة
      const { data: rows } = await supabase
        .from('leaderboard_view')
        .select('id,name,completed_lessons,certificates,quiz_avg')

      if (!rows) { setLoading(false); return }

      const enriched: Leader[] = rows.map((s: any) => {
        const l   = Number(s.completed_lessons) || 0
        const crt = Number(s.certificates)      || 0
        const avg = Number(s.quiz_avg)          || 0
        const points = l * 15 + crt * 100 + avg * 2
        return { id: s.id, name: s.name, completedLessons: l, certificates: crt, quizAvg: avg, points, rank: 0 }
      })

      const sorted = enriched.sort((a, b) => b.points - a.points).map((s, i) => ({ ...s, rank: i + 1 }))
      setLeaders(sorted.slice(0, 50))
      const me = sorted.find(s => s.id === user?.id)
      if (me) setMyRank(me)
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="min-h-screen page-enter" style={{ background:'var(--bg-app)' }} dir="rtl">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl transition-colors hover:bg-white" style={{ color:'var(--text-secondary)' }}>
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ color:'var(--text-primary)' }}>
              <Trophy className="w-6 h-6 text-amber-500" /> لوحة الشرف
            </h1>
            <p className="text-sm font-bold" style={{ color:'var(--text-secondary)' }}>أفضل الطلاب بناءً على النقاط والإنجازات</p>
          </div>
        </div>

        {/* My rank card */}
        {myRank && (
          <div className="mb-6 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0">
              #{myRank.rank}
            </div>
            <div className="flex-1">
              <div className="font-black text-emerald-800">ترتيبك الحالي</div>
              <div className="text-sm text-emerald-600 font-bold">{myRank.points.toLocaleString()} نقطة</div>
            </div>
            <div className="text-right text-xs font-bold text-emerald-700">
              <div>✅ {myRank.completedLessons} درس</div>
              <div>🏆 {myRank.certificates} شهادة</div>
            </div>
          </div>
        )}

        {/* Top 3 */}
        {!loading && leaders.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[leaders[1], leaders[0], leaders[2]].map((l, i) => {
              const ranks = [2, 1, 3]
              const rank = ranks[i]
              const m = MEDAL[rank]
              const MIcon = m.icon
              const heights = ['h-28', 'h-36', 'h-24']
              return (
                <div key={l.id} className={`${m.bg} rounded-2xl p-4 flex flex-col items-center justify-end ${heights[i]} border border-slate-100`}>
                  <div className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center mb-2`}>
                    <MIcon className={`w-5 h-5 ${m.color}`} />
                  </div>
                  <div className="font-black text-slate-800 text-xs text-center truncate w-full text-center">{l.name}</div>
                  <div className="text-[10px] font-bold text-slate-500">{l.points.toLocaleString()} نقطة</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {loading ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} />) :
          leaders.map(l => {
            const isMe = l.id === user?.id
            const m = MEDAL[l.rank]
            const MIcon = m?.icon
            return (
              <div key={l.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isMe ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-white hover:shadow-md'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${m ? `${m.bg} ${m.color}` : 'bg-slate-100 text-slate-500'}`}>
                  {m ? <MIcon className="w-5 h-5" /> : l.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm truncate" style={{ color:'var(--text-primary)' }}>
                    {l.name} {isMe && <span className="text-emerald-600 text-xs">(أنت)</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold text-slate-400">✅ {l.completedLessons}</span>
                    <span className="text-xs font-bold text-slate-400">🏆 {l.certificates}</span>
                    <span className="text-xs font-bold text-slate-400">📊 {l.quizAvg}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-amber-600 text-sm">{l.points.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-slate-400">نقطة</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
