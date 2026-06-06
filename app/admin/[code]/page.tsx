'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { startGame, pauseGame, resumeGame, endGame, resetGame, showIntro, dismissIntro } from '@/lib/session-engine'
import {
  startRound, lockRound, resolveRound,
  triggerHypeSurge, triggerMarketDrop, triggerStableBoost, triggerFoundationSurge
} from '@/lib/round-engine'
import type { Session, Player, Path, Round, GameEvent } from '@/lib/types'
import { PATH_META } from '@/lib/types'

type Tab = 'session' | 'paths' | 'players' | 'events'

export default function AdminDashboard() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [tab, setTab] = useState<Tab>('session')
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [roundDuration, setRoundDuration] = useState(60)

  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setAuthError('Wrong password.')
    }
  }

  useEffect(() => {
    if (!authed) return
    async function load() {
      const { data: sess } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', code)
        .single()

      if (!sess) return
      setSession(sess)

      const [{ data: pls }, { data: pths }, { data: evts }] = await Promise.all([
        supabase.from('players').select('*').eq('session_id', sess.id).order('credits', { ascending: false }),
        supabase.from('paths').select('*').eq('session_id', sess.id),
        supabase.from('events').select('*').eq('session_id', sess.id).order('triggered_at', { ascending: false }).limit(30),
      ])

      if (pls) setPlayers(pls)
      if (pths) setPaths(pths)
      if (evts) setEvents(evts)

      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sess.id)
        .in('status', ['open', 'locked'])
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (round) { setCurrentRound(round); startCountdown(round) }
    }
    load()
  }, [authed, code])

  function startCountdown(round: Round) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (round.status !== 'open') { setTimeLeft(0); return }
    const endTime = new Date(round.started_at).getTime() + round.duration_seconds * 1000
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0 && timerRef.current) clearInterval(timerRef.current)
    }, 500)
  }

  useEffect(() => {
    if (!authed || !session) return
    const channel = supabase
      .channel(`admin-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (p) => setSession(p.new as Session)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${session.id}` },
        () => supabase.from('players').select('*').eq('session_id', session.id)
              .order('credits', { ascending: false }).then(({ data }) => { if (data) setPlayers(data) })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paths', filter: `session_id=eq.${session.id}` },
        (p) => setPaths((prev) => prev.map((path) => path.id === (p.new as Path).id ? p.new as Path : path))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `session_id=eq.${session.id}` },
        (p) => { const r = p.new as Round; setCurrentRound(r); startCountdown(r) }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `session_id=eq.${session.id}` },
        (p) => setEvents((prev) => [p.new as GameEvent, ...prev].slice(0, 30))
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authed, session?.id])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  async function doAction(action: () => Promise<boolean | void>, confirmKey?: string) {
    if (confirmKey && confirmAction !== confirmKey) {
      setConfirmAction(confirmKey)
      return
    }
    setLoading(true)
    setConfirmAction(null)
    await action()
    setLoading(false)
  }

  async function handlePathUpdate(pathId: string, field: string, value: unknown) {
    await supabase.from('paths').update({ [field]: value }).eq('id', pathId)
    setPaths((prev) => prev.map((p) => p.id === pathId ? { ...p, [field]: value } : p))
  }

  if (!authed) {
    return (
      <main className="min-h-dvh grid-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-black text-white">Admin — {code}</h1>
          </div>
          <form onSubmit={handleAuth} className="glass rounded-2xl p-6 space-y-4">
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all active:scale-95">
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-dvh grid-bg flex items-center justify-center">
        <p className="text-slate-400">Loading session {code}...</p>
      </main>
    )
  }

  const pathOrder = ['stable', 'popular', 'success', 'foundation']
  const sortedPaths = pathOrder.map((k) => paths.find((p) => p.key === k)).filter(Boolean) as Path[]
  const leaderboard = [...players].sort((a, b) => b.credits - a.credits)

  return (
    <div className="min-h-dvh bg-[#07070d] grid-bg text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎮</span>
          <div>
            <h1 className="font-black text-white text-lg">Admin Dashboard</h1>
            <p className="text-xs text-slate-500">Session: <span className="font-mono font-bold text-white">{code}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            session.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            session.status === 'lobby' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            session.status === 'paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {session.status}
          </span>
          <span className="text-slate-400 text-sm">Round {session.current_round}</span>
          <a
            href={`/presenter/${code}`}
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors border border-white/10"
          >
            📺 Presenter View
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex gap-0">
        {(['session', 'paths', 'players', 'events'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'session' ? '⚙️ Session' : t === 'paths' ? '📊 Paths' : t === 'players' ? '👥 Players' : '📋 Events'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* ── SESSION TAB ─────────────────────────────────────────────────── */}
        {tab === 'session' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            {/* Session Controls */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white text-base">Session Control</h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Intro controls */}
                <button
                  onClick={() => doAction(() => showIntro(session.id))}
                  disabled={loading}
                  className="col-span-2 py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium text-sm transition-all active:scale-95"
                >
                  🎬 Show Intro Screen
                </button>
                <button
                  onClick={() => doAction(() => dismissIntro(session.id))}
                  disabled={loading}
                  className="col-span-2 py-2.5 px-4 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 font-medium text-sm transition-all active:scale-95"
                >
                  ✕ Dismiss Intro
                </button>

                {session.status === 'lobby' && (
                  <button
                    onClick={() => doAction(() => startGame(session.id))}
                    disabled={loading}
                    className="col-span-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95"
                  >
                    ▶ Start Game
                  </button>
                )}
                {session.status === 'active' && (
                  <button
                    onClick={() => doAction(() => pauseGame(session.id))}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium text-sm transition-all active:scale-95"
                  >
                    ⏸ Pause
                  </button>
                )}
                {session.status === 'paused' && (
                  <button
                    onClick={() => doAction(() => resumeGame(session.id))}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-sm transition-all active:scale-95"
                  >
                    ▶ Resume
                  </button>
                )}
                {(session.status === 'active' || session.status === 'paused') && (
                  <button
                    onClick={() => doAction(() => endGame(session.id), 'end')}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-medium text-sm transition-all active:scale-95"
                  >
                    {confirmAction === 'end' ? '⚠️ Confirm End' : '■ End Game'}
                  </button>
                )}
                <button
                  onClick={() => doAction(() => resetGame(session.id), 'reset')}
                  disabled={loading}
                  className="col-span-2 py-2.5 rounded-xl bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 font-medium text-sm transition-all active:scale-95"
                >
                  {confirmAction === 'reset' ? '⚠️ Confirm Full Reset' : '↺ Reset Game'}
                </button>
              </div>
            </div>

            {/* Round Controls */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white text-base">Round Control</h2>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-400 whitespace-nowrap">Duration (s):</label>
                <input
                  type="number"
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(Number(e.target.value))}
                  min={10} max={300}
                  className="w-24 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Timer display */}
              {currentRound && (
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Round {currentRound.round_number} — {currentRound.status}</p>
                  {currentRound.status === 'open' && (
                    <p className="text-3xl font-black text-white tabular-nums">{timeLeft}s</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => doAction(() => startRound(session.id, roundDuration).then(() => undefined))}
                  disabled={loading || session.status !== 'active' || (currentRound?.status === 'open')}
                  className="py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ▶ Start Round
                </button>
                <button
                  onClick={() => currentRound && doAction(() => lockRound(currentRound.id, session.id))}
                  disabled={loading || !currentRound || currentRound.status !== 'open'}
                  className="py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔒 Lock Choices
                </button>
                <button
                  onClick={() => currentRound && doAction(() => resolveRound(currentRound.id, session.id))}
                  disabled={loading || !currentRound || currentRound.status === 'open'}
                  className="py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✓ Resolve Round
                </button>
              </div>
            </div>

            {/* Event Triggers */}
            <div className="glass rounded-2xl p-6 space-y-4 lg:col-span-2">
              <h2 className="font-bold text-white text-base">Special Events</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => doAction(() => triggerHypeSurge(session.id))}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium text-sm transition-all active:scale-95 text-center"
                >
                  <div className="text-2xl mb-1">🔥</div>
                  Hype Surge
                </button>
                <button
                  onClick={() => doAction(() => triggerMarketDrop(session.id))}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-medium text-sm transition-all active:scale-95 text-center"
                >
                  <div className="text-2xl mb-1">📉</div>
                  Market Drop
                </button>
                <button
                  onClick={() => doAction(() => triggerStableBoost(session.id))}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium text-sm transition-all active:scale-95 text-center"
                >
                  <div className="text-2xl mb-1">🛡️</div>
                  Stable Boost
                </button>
                <button
                  onClick={() => doAction(() => triggerFoundationSurge(session.id), 'foundation')}
                  disabled={loading}
                  className={`py-3 px-4 rounded-xl font-medium text-sm transition-all active:scale-95 text-center ${
                    confirmAction === 'foundation'
                      ? 'bg-emerald-500/40 text-emerald-200 border border-emerald-400/50 animate-pulse'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🌱</div>
                  {confirmAction === 'foundation' ? '⚠️ Confirm Surge' : 'Foundation Surge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PATHS TAB ────────────────────────────────────────────────────── */}
        {tab === 'paths' && (
          <div className="space-y-4 max-w-4xl">
            {sortedPaths.map((path) => {
              const meta = PATH_META[path.key as keyof typeof PATH_META]
              return (
                <div key={path.id} className="glass rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${meta.bgClass} flex items-center justify-center text-xl`}>{meta.icon}</div>
                    <div>
                      <h3 className="font-bold text-white">{meta.name}</h3>
                      <p className={`text-sm ${meta.textClass}`}>Current: {path.current_value.toFixed(2)} | Trend: {path.visible_trend}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Current Value</label>
                      <input
                        type="number"
                        defaultValue={path.current_value}
                        onBlur={(e) => handlePathUpdate(path.id, 'current_value', Number(e.target.value))}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Hidden Target</label>
                      <input
                        type="number"
                        defaultValue={path.hidden_target_value}
                        onBlur={(e) => handlePathUpdate(path.id, 'hidden_target_value', Number(e.target.value))}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Min Change</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={path.min_change}
                        onBlur={(e) => handlePathUpdate(path.id, 'min_change', Number(e.target.value))}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Max Change</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={path.max_change}
                        onBlur={(e) => handlePathUpdate(path.id, 'max_change', Number(e.target.value))}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Rigging Mode</label>
                      <select
                        value={path.rigging_mode}
                        onChange={(e) => handlePathUpdate(path.id, 'rigging_mode', e.target.value)}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="random">Random</option>
                        <option value="scripted">Scripted</option>
                        <option value="override">Manual Override</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Trend Override</label>
                      <select
                        value={path.trend_override || ''}
                        onChange={(e) => handlePathUpdate(path.id, 'trend_override', e.target.value || null)}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="">None (auto)</option>
                        <option value="steady">Steady</option>
                        <option value="rising">Rising</option>
                        <option value="falling">Falling</option>
                        <option value="surging">Surging</option>
                        <option value="uncertain">Uncertain</option>
                      </select>
                    </div>
                  </div>

                  {/* Scripted values */}
                  {path.rigging_mode === 'scripted' && path.scripted_values && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Scripted Values (per-round multipliers)</label>
                      <div className="flex flex-wrap gap-2">
                        {path.scripted_values.map((v, i) => (
                          <div key={i} className="glass rounded-lg px-3 py-1 text-xs">
                            <span className="text-slate-400">R{i + 1}:</span>{' '}
                            <span className={v >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {v >= 0 ? '+' : ''}{(v * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── PLAYERS TAB ──────────────────────────────────────────────────── */}
        {tab === 'players' && (
          <div className="max-w-3xl">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-bold text-white">Players ({players.length})</h2>
              </div>
              {players.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-500">No players have joined yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {leaderboard.map((player, idx) => {
                    const pathInfo = player.current_path_id ? paths.find((p) => p.id === player.current_path_id) : null
                    const pathMeta = pathInfo ? PATH_META[pathInfo.key as keyof typeof PATH_META] : null
                    return (
                      <div key={player.id} className="px-5 py-3 flex items-center gap-4">
                        <span className="text-lg w-8 text-center">{idx + 1 <= 3 ? ['🥇','🥈','🥉'][idx] : `#${idx + 1}`}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{player.display_name}</p>
                          {pathMeta && <p className={`text-xs ${pathMeta.textClass}`}>{pathMeta.name}</p>}
                        </div>
                        <p className="font-black text-white tabular-nums">{Math.round(player.credits)}</p>
                        <span className={`w-2 h-2 rounded-full ${player.is_connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ───────────────────────────────────────────────────── */}
        {tab === 'events' && (
          <div className="max-w-2xl">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="font-bold text-white">Event Log</h2>
              </div>
              {events.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-500">No events yet.</div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                  {events.map((evt) => (
                    <div key={evt.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-slate-500">{evt.event_type}</span>
                        <span className="text-xs text-slate-600">
                          {new Date(evt.triggered_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">{evt.message}</p>
                      <p className="text-xs text-slate-600 mt-0.5">by {evt.triggered_by}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
