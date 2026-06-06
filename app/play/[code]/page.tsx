'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session, Player, Path, Round, GameEvent } from '@/lib/types'
import { PATH_META } from '@/lib/types'
import { getStudentForecastHint } from '@/lib/forecast-engine'

type PlayerScreen = 'lobby' | 'round' | 'locked' | 'results' | 'ended'

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [session, setSession] = useState<Session | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [screen, setScreen] = useState<PlayerScreen>('lobby')
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [confirmedPathId, setConfirmedPathId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [prevCredits, setPrevCredits] = useState<number | null>(null)
  const [creditChange, setCreditChange] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial data
  useEffect(() => {
    const playerId = localStorage.getItem(`mission-player-${code}`)
    if (!playerId) {
      router.push(`/join/${code}`)
      return
    }

    async function load() {
      const { data: sess } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', code)
        .single()
      if (!sess) return
      setSession(sess)

      const { data: pl } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId!)
        .single()
      if (!pl) { router.push(`/join/${code}`); return }
      setPlayer(pl)

      const { data: pths } = await supabase
        .from('paths')
        .select('*')
        .eq('session_id', sess.id)
      if (pths) setPaths(pths)

      // Current round
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sess.id)
        .in('status', ['open', 'locked'])
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (round) {
        setCurrentRound(round)
        determineScreen(sess, round, pl)
        if (round.status === 'open') startTimer(round)

        // Check for existing choice
        const { data: choice } = await supabase
          .from('choices')
          .select('path_id')
          .eq('round_id', round.id)
          .eq('player_id', playerId!)
          .maybeSingle()
        if (choice) setConfirmedPathId(choice.path_id)
      } else {
        determineScreen(sess, null, pl)
      }
    }
    load()
  }, [code])

  function determineScreen(sess: Session, round: Round | null, pl: Player) {
    if (sess.status === 'ended') { setScreen('ended'); return }
    if (sess.status === 'lobby' || sess.status === 'paused' || !round) { setScreen('lobby'); return }
    if (round.status === 'open') { setScreen('round'); return }
    if (round.status === 'locked') { setScreen('locked'); return }
    if (round.status === 'resolved') { setScreen('results'); return }
  }

  function startTimer(round: Round) {
    if (timerRef.current) clearInterval(timerRef.current)
    const endTime = new Date(round.started_at).getTime() + round.duration_seconds * 1000
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0 && timerRef.current) clearInterval(timerRef.current)
    }, 500)
  }

  // Realtime
  useEffect(() => {
    if (!session) return
    const playerId = localStorage.getItem(`mission-player-${code}`)

    const channel = supabase
      .channel(`player-${playerId}-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (p) => {
          const updated = p.new as Session
          setSession(updated)
          determineScreen(updated, currentRound, player!)
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `session_id=eq.${session.id}` },
        (p) => {
          const updated = p.new as Round
          setCurrentRound(updated)
          determineScreen(session!, updated, player!)
          if (updated.status === 'open') {
            // New round: clear last round's choice so player picks fresh
            setConfirmedPathId(null)
            setSelectedPathId(null)
            setCreditChange(0)
            startTimer(updated)
          }
          if (updated.status === 'resolved') {
            // Refresh player credits
            supabase.from('players').select('*').eq('id', playerId!).single().then(({ data }) => {
              if (data) {
                setCreditChange(data.credits - (player?.credits ?? data.credits))
                setPrevCredits(player?.credits ?? null)
                setPlayer(data)
              }
            })
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paths', filter: `session_id=eq.${session.id}` },
        (p) => setPaths((prev) => prev.map((path) => path.id === (p.new as Path).id ? p.new as Path : path))
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` },
        (p) => {
          const updated = p.new as Player
          setCreditChange(updated.credits - (player?.credits ?? updated.credits))
          setPlayer(updated)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session?.id, currentRound?.id, player?.credits])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  async function handleSelectPath(pathId: string) {
    if (!currentRound || currentRound.status !== 'open' || !player) return
    setSelectedPathId(pathId)

    const playerId = localStorage.getItem(`mission-player-${code}`)
    // Upsert choice
    await supabase.from('choices').upsert({
      session_id: session!.id,
      round_id: currentRound.id,
      player_id: playerId!,
      path_id: pathId,
    }, { onConflict: 'round_id,player_id' })

    setConfirmedPathId(pathId)

    // Update player's current_path_id so presenter leaderboard shows live path
    await supabase.from('players').update({ current_path_id: pathId }).eq('id', playerId!)

    // Log switch event
    await supabase.from('events').insert({
      session_id: session!.id,
      event_type: 'path_switched',
      message: `${player.display_name} chose a path.`,
      triggered_by: 'system',
    })
  }

  const pathOrder = ['stable', 'popular', 'success', 'foundation']
  const sortedPaths = pathOrder.map((k) => paths.find((p) => p.key === k)).filter(Boolean) as Path[]
  const timerPercent = currentRound ? (timeLeft / currentRound.duration_seconds) * 100 : 0
  const confirmedPath = confirmedPathId ? paths.find((p) => p.id === confirmedPathId) : null
  const confirmedMeta = confirmedPath ? PATH_META[confirmedPath.key as keyof typeof PATH_META] : null

  return (
    <main className="min-h-dvh bg-[#07070d] grid-bg text-white flex flex-col">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-mono">{code}</p>
          <p className="font-bold text-white">{player?.display_name ?? '...'}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums">{Math.round(player?.credits ?? 500)}</p>
          <p className="text-xs text-slate-500">credits</p>
        </div>
      </header>

      {/* Credit change banner */}
      {creditChange !== 0 && screen === 'results' && (
        <div className={`mx-4 mb-3 py-2 px-4 rounded-xl text-center font-bold ${creditChange > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {creditChange > 0 ? '+' : ''}{Math.round(creditChange)} credits this round
        </div>
      )}

      <div className="flex-1 px-4 pb-6 flex flex-col gap-4">
        {/* ── LOBBY ── */}
        {screen === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="text-6xl">⏳</div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                {session?.status === 'paused' ? 'Game Paused' : 'Waiting to Start'}
              </h2>
              <p className="text-slate-400">The facilitator will begin the game shortly.</p>
            </div>
            <div className="flex gap-1.5">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── ROUND ── */}
        {screen === 'round' && (
          <>
            {/* Timer */}
            <div className="glass rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Round {currentRound?.round_number}</p>
                <p className="font-bold text-white">Choose your path</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle
                      cx="20" cy="20" r="16" fill="none"
                      stroke={timeLeft > 15 ? '#10b981' : timeLeft > 8 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - timerPercent / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>

            {/* Path cards */}
            <div className="space-y-3">
              {sortedPaths.map((path) => {
                const meta = PATH_META[path.key as keyof typeof PATH_META]
                const isSelected = confirmedPathId === path.id
                const hint = getStudentForecastHint(path.key, path.visible_trend)

                return (
                  <button
                    key={path.id}
                    onClick={() => handleSelectPath(path.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 active:scale-98 ${
                      isSelected
                        ? `${meta.bgClass} ${meta.borderClass} shadow-lg ${meta.glowClass}`
                        : 'glass border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${isSelected ? meta.bgClass : 'bg-white/5'}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${isSelected ? meta.textClass : 'text-white'}`}>{meta.name}</p>
                          {isSelected && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${meta.bgClass} ${meta.textClass}`}>Selected ✓</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
                      </div>
                      <div className={`text-right ${isSelected ? meta.textClass : 'text-slate-500'}`}>
                        <p className="text-lg font-black">{path.current_value.toFixed(0)}</p>
                        <p className="text-xs">{path.visible_trend}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── LOCKED ── */}
        {screen === 'locked' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="text-5xl">🔒</div>
            <div>
              <h2 className="text-xl font-black text-white mb-2">Choices Locked</h2>
              <p className="text-slate-400">Calculating results...</p>
            </div>
            {confirmedMeta && confirmedPath && (
              <div className={`glass rounded-2xl p-5 ${confirmedMeta.borderClass} border text-center`}>
                <div className="text-3xl mb-2">{confirmedMeta.icon}</div>
                <p className={`font-bold ${confirmedMeta.textClass}`}>{confirmedMeta.name}</p>
                <p className="text-slate-400 text-sm mt-1">Your choice this round</p>
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === 'results' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="glass rounded-2xl p-5 text-center">
              <p className="text-sm text-slate-400 mb-1">Round {currentRound?.round_number} Results</p>
              <p className="text-4xl font-black text-white tabular-nums">{Math.round(player?.credits ?? 0)}</p>
              <p className="text-slate-400">credits</p>
              {creditChange !== 0 && (
                <p className={`text-lg font-bold mt-2 ${creditChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {creditChange > 0 ? '+' : ''}{Math.round(creditChange)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {sortedPaths.map((path) => {
                const meta = PATH_META[path.key as keyof typeof PATH_META]
                const isMyPath = confirmedPathId === path.id
                return (
                  <div key={path.id} className={`glass rounded-xl p-3 flex items-center gap-3 border ${isMyPath ? meta.borderClass : 'border-white/5'}`}>
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{meta.name}</p>
                      <p className="text-xs text-slate-500">{path.visible_trend}</p>
                    </div>
                    <p className={`font-black tabular-nums ${meta.textClass}`}>{path.current_value.toFixed(1)}</p>
                    {isMyPath && <span className="text-xs text-slate-400">← you</span>}
                  </div>
                )
              })}
            </div>
            <p className="text-center text-sm text-slate-500">Waiting for next round...</p>
          </div>
        )}

        {/* ── ENDED ── */}
        {screen === 'ended' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="text-6xl">🏁</div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Game Over!</h2>
              <p className="text-slate-400">Final credits:</p>
              <p className="text-5xl font-black text-white mt-2 tabular-nums">{Math.round(player?.credits ?? 0)}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="py-3 px-8 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all"
            >
              Home
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
