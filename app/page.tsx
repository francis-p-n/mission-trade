'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/session-engine'

export default function HomePage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  async function handleCreateSession() {
    setCreating(true)
    setError('')
    const result = await createSession()
    if (result) {
      router.push(`/admin/${result.sessionCode}`)
    } else {
      setError('Failed to create session. Check your Supabase connection.')
      setCreating(false)
    }
  }

  function handleJoinSession(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) {
      setError('Please enter a valid 4-character session code.')
      return
    }
    router.push(`/join/${code}`)
  }

  return (
    <main className="min-h-dvh grid-bg flex flex-col items-center justify-center px-4">
      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        {/* Logo / Title */}
        <div className="space-y-3">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-emerald-400 bg-clip-text text-transparent">
            Mission Market
          </h1>
          <p className="text-slate-400 text-lg">
            The investment simulation that teaches what matters most.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {/* Facilitator */}
          <div className="glass rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🎮</div>
              <div>
                <p className="font-semibold text-white">Facilitator</p>
                <p className="text-sm text-slate-400">Create and run a session</p>
              </div>
            </div>
            <button
              onClick={handleCreateSession}
              disabled={creating}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {creating ? 'Creating Session...' : 'Create New Session'}
            </button>
          </div>

          {/* Student */}
          <div className="glass rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">📱</div>
              <div>
                <p className="font-semibold text-white">Student</p>
                <p className="text-sm text-slate-400">Join with a session code</p>
              </div>
            </div>
            <form onSubmit={handleJoinSession} className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. K7F2)"
                maxLength={4}
                className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20"
              >
                Join Session
              </button>
            </form>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <p className="text-slate-600 text-xs">
          Mission Market — Youth Session Game
        </p>
      </div>
    </main>
  )
}
