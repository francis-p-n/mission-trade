'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session, Player, Path, Round, GameEvent } from '@/lib/types'
import { PATH_META } from '@/lib/types'
import { getForecastLabel, getStudentForecastHint } from '@/lib/forecast-engine'
import { generateQRCodeDataUrl, getJoinUrl } from '@/lib/qr'
import IntroScreen from '@/components/IntroScreen'

export default function PresenterPage() {
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [showIntro, setShowIntro] = useState(false)
  const [introExiting, setIntroExiting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevPathValues = useRef<Record<string, number>>({})

  // Load initial data
  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', code)
        .single()

      if (!sess) return
      setSession(sess)
      setShowIntro(sess.show_intro)

      const [{ data: pls }, { data: pths }, { data: evts }] = await Promise.all([
        supabase.from('players').select('*').eq('session_id', sess.id).order('credits', { ascending: false }),
        supabase.from('paths').select('*').eq('session_id', sess.id),
        supabase.from('events').select('*').eq('session_id', sess.id).order('triggered_at', { ascending: false }).limit(20),
      ])

      if (pls) setPlayers(pls)
      if (pths) {
        setPaths(pths)
        const vals: Record<string, number> = {}
        pths.forEach((p: Path) => { vals[p.id] = p.current_value })
        prevPathValues.current = vals
      }
      if (evts) setEvents(evts)

      // Load active round
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
        startTimer(round)
      }

      // Generate QR
      const qr = await generateQRCodeDataUrl(code)
      setQrDataUrl(qr)
    }
    load()
  }, [code])

  function startTimer(round: Round) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (round.status !== 'open') { setTimeLeft(0); return }
    const endTime = new Date(round.started_at).getTime() + round.duration_seconds * 1000
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0 && timerRef.current) clearInterval(timerRef.current)
    }, 500)
  }

  // Realtime subscriptions
  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel(`presenter-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Session
          setSession(updated)
          if (updated.show_intro && !showIntro) {
            setIntroExiting(false)
            setShowIntro(true)
          } else if (!updated.show_intro && showIntro) {
            setIntroExiting(true)
            setTimeout(() => { setShowIntro(false); setIntroExiting(false) }, 900)
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${session.id}` },
        () => {
          supabase.from('players').select('*').eq('session_id', session.id)
            .order('credits', { ascending: false })
            .then(({ data }) => { if (data) setPlayers(data) })
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paths', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Path
          setPaths((prev) => {
            const next = prev.map((p) => p.id === updated.id ? updated : p)
            return next
          })
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Round
          setCurrentRound(updated)
          startTimer(updated)
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `session_id=eq.${session.id}` },
        (payload) => {
          setEvents((prev) => [payload.new as GameEvent, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session?.id, showIntro])

  // Cleanup timer
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const leaderboard = [...players].sort((a, b) => b.credits - a.credits).slice(0, 5)
  const totalPlayers = players.length
  const pathOrder: (keyof typeof PATH_META)[] = ['stable', 'popular', 'success', 'foundation']
  const sortedPaths = pathOrder.map((k) => paths.find((p) => p.key === k)).filter(Boolean) as Path[]

  const timerPercent = currentRound ? (timeLeft / currentRound.duration_seconds) * 100 : 0
  const timerColor = timeLeft > 20 ? '#10b981' : timeLeft > 10 ? '#f59e0b' : '#ef4444'

  return (
    <div className="min-h-dvh bg-[#07070d] grid-bg text-white overflow-hidden relative flex flex-col">
      {/* Intro overlay */}
      {showIntro && (
        <IntroScreen exiting={introExiting} />
      )}

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-900/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-900/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-2xl">📈</span>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Mission Market</h1>
            <p className="text-xs text-slate-500">
              {session?.status === 'lobby' ? 'Waiting to start' :
               session?.status === 'active' ? `Round ${session.current_round} — Live` :
               session?.status === 'paused' ? 'Paused' :
               session?.status === 'ended' ? 'Game Over' : ''}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-6">
          {currentRound?.status === 'open' && (
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke={timerColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPercent / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: timerColor }}>
                  {timeLeft}
                </span>
              </div>
              <span className="text-slate-400 text-sm">seconds left</span>
            </div>
          )}

          <div className="text-right">
            <p className="text-2xl font-black text-white font-mono tracking-widest">{code}</p>
            <p className="text-xs text-slate-500">{totalPlayers} player{totalPlayers !== 1 ? 's' : ''} joined</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 gap-6 p-6 min-h-0">
        {/* Left: Paths */}
        <div className="flex-1 flex flex-col min-h-0">
          {session?.status === 'lobby' ? (
            // Lobby state: show QR code
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
              <div className="space-y-2 text-center">
                <h2 className="text-4xl font-black">Join Now</h2>
                <p className="text-slate-400 text-xl">Scan the QR code or enter the session code on your phone</p>
              </div>
              <div className="flex items-center gap-12">
                {qrDataUrl && (
                  <div className="glass rounded-3xl p-6">
                    <img src={qrDataUrl} alt="Join QR" className="w-48 h-48" />
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Session Code</p>
                    <p className="text-7xl font-black font-mono tracking-widest text-white">{code}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">{getJoinUrl(code)}</p>
                  </div>
                  <div className="glass rounded-xl px-4 py-2 text-center">
                    <span className="text-emerald-400 font-semibold">{totalPlayers}</span>
                    <span className="text-slate-400 text-sm ml-2">players joined</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 w-full max-w-2xl">
                {sortedPaths.map((path) => {
                  const meta = PATH_META[path.key as keyof typeof PATH_META]
                  return (
                    <div key={path.id} className={`glass rounded-xl p-3 text-center border ${meta.borderClass}`}>
                      <div className="text-2xl mb-1">{meta.icon}</div>
                      <p className="text-xs font-semibold text-slate-300">{meta.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 glass rounded-3xl p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <span>📊</span> Market Overview
                </h2>
                <div className="text-sm text-slate-400 font-semibold bg-white/5 px-4 py-1.5 rounded-full">
                  Values out of 300
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-around gap-6">
                {sortedPaths.map((path) => {
                  const meta = PATH_META[path.key as keyof typeof PATH_META]
                  const forecast = getForecastLabel(path)
                  const hint = getStudentForecastHint(path.key, path.visible_trend)
                  const playerCount = players.filter((p) => p.current_path_id === path.id).length
                  const isSurging = path.visible_trend === 'surging'

                  return (
                    <div key={path.id} className={`flex flex-col gap-2 group ${isSurging ? 'surge-active' : ''} transition-all duration-500`}>
                      <div className="flex items-end justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${meta.bgClass} flex items-center justify-center text-2xl shrink-0 border ${meta.borderClass} shadow-lg`}>
                            {meta.icon}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-3">
                              <h3 className="font-bold text-white text-xl">{meta.name}</h3>
                              <span className="text-sm text-slate-400">{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${forecast.color} ${meta.bgClass} border ${meta.borderClass}`}>
                            {forecast.arrow} {forecast.label}
                          </div>
                          <span className="text-3xl font-black text-white tabular-nums w-20 text-right">
                            {path.current_value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {/* Value bar */}
                      <div className="h-8 rounded-2xl bg-white/5 overflow-hidden shadow-inner relative border border-white/5">
                        <div
                          className="h-full rounded-2xl transition-all duration-1000 ease-out relative"
                          style={{
                            width: `${Math.min(100, (path.current_value / 300) * 100)}%`,
                            backgroundColor: meta.color,
                            boxShadow: `0 0 20px ${meta.color}40`,
                          }}
                        >
                          {isSurging && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Leaderboard + Events */}
        <div className="w-72 flex flex-col gap-4">
          {/* Leaderboard */}
          <div className="glass rounded-2xl p-5 flex-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🏆</span> Leaderboard
            </h2>
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No players yet</p>
              ) : (
                leaderboard.map((player, idx) => {
                  const rank = idx + 1
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
                  const pathInfo = player.current_path_id ? paths.find((p) => p.id === player.current_path_id) : null
                  const pathMeta = pathInfo ? PATH_META[pathInfo.key as keyof typeof PATH_META] : null
                  return (
                    <div key={player.id} className={`flex items-center gap-3 p-2 rounded-xl ${rank === 1 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-white/3'} transition-colors`}>
                      <span className="text-lg w-8 text-center">{medal}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{player.display_name}</p>
                        {pathMeta && (
                          <p className={`text-xs ${pathMeta.textClass}`}>{pathMeta.name}</p>
                        )}
                      </div>
                      <p className="font-black text-white tabular-nums">{Math.round(player.credits)}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Event feed */}
          <div className="glass rounded-2xl p-5" style={{ maxHeight: '220px' }}>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📡</span> Live Feed
            </h2>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '150px' }}>
              {events.length === 0 ? (
                <p className="text-slate-600 text-xs">No events yet</p>
              ) : (
                events.map((evt) => (
                  <p key={evt.id} className="text-xs text-slate-300 leading-relaxed border-l-2 border-white/10 pl-2">
                    {evt.message}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* QR mini */}
          {session?.status !== 'lobby' && qrDataUrl && (
            <div className="glass rounded-2xl p-4 text-center">
              <img src={qrDataUrl} alt="Join QR" className="w-24 h-24 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Scan to join</p>
              <p className="font-mono font-black text-white text-xl tracking-widest">{code}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
