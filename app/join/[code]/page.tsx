'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const displayName = name.trim()
    if (!displayName) { setError('Please enter your name.'); return }
    if (displayName.length > 20) { setError('Name must be 20 characters or less.'); return }

    setLoading(true)
    setError('')

    // Find the session
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('session_code', code)
      .single()

    if (!session) {
      setError('Session not found. Check your code and try again.')
      setLoading(false)
      return
    }

    if (session.status === 'ended') {
      setError('This session has ended.')
      setLoading(false)
      return
    }

    // Create player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        session_id: session.id,
        display_name: displayName,
        credits: 500,
        is_connected: true,
      })
      .select()
      .single()

    if (playerError || !player) {
      setError('Could not join. Try again.')
      setLoading(false)
      return
    }

    // Log event
    await supabase.from('events').insert({
      session_id: session.id,
      event_type: 'player_joined',
      message: `${displayName} joined the game.`,
      triggered_by: 'system',
    })

    // Save player id to localStorage
    localStorage.setItem(`mission-player-${code}`, player.id)
    localStorage.setItem(`mission-name-${code}`, displayName)

    router.push(`/play/${code}`)
  }

  return (
    <main className="min-h-dvh grid-bg flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="text-5xl">📈</div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
            Mission Market
          </h1>
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-300">Session <span className="font-mono font-bold text-white">{code}</span></span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="glass rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-lg focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all"
              autoFocus
              autoComplete="given-name"
            />
            <p className="text-xs text-slate-600 mt-1.5">{name.length}/20 characters</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Joining...' : 'Join Game →'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs">
          You&apos;ll start with <span className="text-emerald-400 font-semibold">500 credits</span>
        </p>
      </div>
    </main>
  )
}
